import * as SQLite from 'expo-sqlite';
import { kvGet, kvSet } from '../db/client';
import { batchUpsertParks } from '../db/parks';
import { Park } from '../types';

// PAD-US 3.0 — USGS Protected Areas Database of the United States
// Layer 1 = Fee ownership (state parks are fee-owned land)
const PADUS_ENDPOINT =
  'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/PAD_US3_0/FeatureServer/1/query';

const CACHE_KEY = 'padus_state_parks_v3'; // bumped — invalidate empty cache from broken run
const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const PAGE_SIZE = 1000;

// PAD-US designation type codes → our display label
const DESIGNATION_TYPES: Array<{ desType: string; designation: string }> = [
  { desType: 'SP',  designation: 'State Park' },
  { desType: 'SF',  designation: 'State Forest' },
  { desType: 'SB',  designation: 'State Beach' },
  { desType: 'SRA', designation: 'State Recreation Area' },
];

interface PadusFeature {
  attributes: {
    Unit_Nm:   string;
    Des_Tp:    string;
    State_Nm:  string; // 2-letter state abbreviation in PAD-US 3.0
    Mang_Nm?:  string;
  };
  centroid?: {
    x: number; // longitude (WGS84)
    y: number; // latitude  (WGS84)
  };
}

async function fetchPage(
  desType: string,
  offset: number
): Promise<{ features: PadusFeature[]; hasMore: boolean }> {
  // Build URL manually — URLSearchParams encodes '=' as %3D and "'" as %27
  // inside values, which ArcGIS REST rejects with "Invalid URL".
  const where = encodeURIComponent(`Mang_Type='STAT' AND Des_Tp='${desType}'`);
  const url = `${PADUS_ENDPOINT}?where=${where}&outFields=*&returnCentroid=true&returnGeometry=false&outSR=4326&resultOffset=${offset}&resultRecordCount=${PAGE_SIZE}&f=json`;
  console.log('[PAD-US] Fetching:', url.slice(0, 120));

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`PAD-US HTTP ${res.status}`);

  const json = await res.json();

  if (json.error) throw new Error(`PAD-US API error: ${JSON.stringify(json.error)}`);

  // Log first feature so we can verify field names and structure
  if (offset === 0 && json.features?.length > 0) {
    const sample = json.features[0];
    console.log('[PAD-US] First feature attributes:', JSON.stringify(sample.attributes));
    console.log('[PAD-US] First feature centroid:', JSON.stringify(sample.centroid));
    console.log('[PAD-US] Total features in page:', json.features.length);
    console.log('[PAD-US] exceededTransferLimit:', json.exceededTransferLimit);
  }

  if (offset === 0 && (!json.features || json.features.length === 0)) {
    console.warn('[PAD-US] Zero results. Full response:', JSON.stringify(json).slice(0, 500));
  }

  return {
    features: json.features ?? [],
    hasMore:  json.exceededTransferLimit === true,
  };
}

async function fetchAllOfType(
  desType: string,
  designation: string
): Promise<Park[]> {
  const parks: Park[] = [];
  const seen = new Set<string>();
  let offset = 0;

  while (true) {
    const { features, hasMore } = await fetchPage(desType, offset);

    for (const f of features) {
      const name = f.attributes.Unit_Nm?.trim();
      if (!name) continue;

      // State_Nm is 2-letter abbreviation in PAD-US 3.0
      const stateCode = f.attributes.State_Nm?.trim().toUpperCase();
      if (!stateCode || stateCode.length !== 2) continue;

      // Centroid required for map placement
      const lon = f.centroid?.x;
      const lat = f.centroid?.y;
      if (!lon || !lat) continue;

      // Deduplicate by name + state
      const key = `${name}|${stateCode}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 50);
      const id = `padus_${stateCode}_${slug}`;

      parks.push({
        id,
        source:      'state',
        fullName:    name,
        description: '',
        stateCodes:  stateCode,
        latitude:    lat,
        longitude:   lon,
        designation,
        imageUrl:    null,
        rawJson:     '',
        lastSynced:  Date.now(),
      });
    }

    if (!hasMore || features.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return parks;
}

export async function syncStateParksFromPadus(
  db: SQLite.SQLiteDatabase,
  onProgress?: (msg: string) => void
): Promise<void> {
  const lastSync = await kvGet(db, CACHE_KEY);
  if (lastSync && Date.now() - parseInt(lastSync) < CACHE_TTL_MS) return;

  await db.runAsync("DELETE FROM parks WHERE source = 'state'");

  let total = 0;
  for (const { desType, designation } of DESIGNATION_TYPES) {
    onProgress?.(`Loading ${designation}s…`);
    try {
      const parks = await fetchAllOfType(desType, designation);
      if (parks.length > 0) await batchUpsertParks(db, parks);
      total += parks.length;
      onProgress?.(`Loaded ${total} parks so far…`);
    } catch (err) {
      console.warn(`PAD-US fetch failed for ${designation}:`, err);
    }
  }

  // Only cache a successful run — if we got 0 parks something went wrong
  // and we want to retry on next launch instead of sitting on a stale empty cache.
  if (total > 0) await kvSet(db, CACHE_KEY, String(Date.now()));
  onProgress?.(`Synced ${total} state parks from PAD-US`);
}
