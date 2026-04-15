import * as SQLite from 'expo-sqlite';
import { kvGet, kvSet } from '../db/client';
import { batchUpsertParks } from '../db/parks';
import { Park } from '../types';

// PAD-US 3.0 — USGS Protected Areas Database of the United States
// Layer 1 = Fee ownership (state parks are fee-owned land)
const PADUS_ENDPOINT =
  'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/PAD_US3_0/FeatureServer/1/query';

const CACHE_KEY = 'padus_state_parks_v1';
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
  const params = new URLSearchParams({
    where:               `Mang_Type='STAT' AND Des_Tp='${desType}'`,
    outFields:           'Unit_Nm,Des_Tp,State_Nm,Mang_Nm',
    returnCentroid:      'true',
    outSR:               '4326',
    resultOffset:        String(offset),
    resultRecordCount:   String(PAGE_SIZE),
    f:                   'json',
  });

  const res = await fetch(`${PADUS_ENDPOINT}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`PAD-US HTTP ${res.status}`);

  const json = await res.json();
  if (json.error) throw new Error(`PAD-US error: ${json.error.message}`);

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

  await kvSet(db, CACHE_KEY, String(Date.now()));
  onProgress?.(`Synced ${total} state parks from PAD-US`);
}
