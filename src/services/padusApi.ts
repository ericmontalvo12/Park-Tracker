import * as SQLite from 'expo-sqlite';
import { kvGet, kvSet } from '../db/client';
import { batchUpsertParks } from '../db/parks';
import { Park } from '../types';

// PAD-US 3.0 — USGS Protected Areas Database of the United States
// Layer 1 = Fee ownership (state parks are fee-owned land)
const PADUS_ENDPOINT =
  'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/PAD_US3_0/FeatureServer/1/query';

const CACHE_KEY = 'padus_state_parks_v5'; // bumped — fix where-clause encoding
const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const PAGE_SIZE = 1000;

// PAD-US designation type codes → our display label
const DESIGNATION_TYPES: Array<{ desType: string; designation: string }> = [
  { desType: 'SP',  designation: 'State Park' },
  { desType: 'SF',  designation: 'State Forest' },
  { desType: 'SB',  designation: 'State Beach' },
  { desType: 'SRA', designation: 'State Recreation Area' },
];

// Full state name → 2-letter postal code
// PAD-US 3.0 State_Nm field may contain full names in some layers.
const STATE_NAME_TO_CODE: Record<string, string> = {
  'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
  'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE',
  'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI', 'IDAHO': 'ID',
  'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA', 'KANSAS': 'KS',
  'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
  'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
  'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV',
  'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK',
  'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT',
  'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV',
  'WISCONSIN': 'WI', 'WYOMING': 'WY', 'DISTRICT OF COLUMBIA': 'DC',
  'PUERTO RICO': 'PR', 'VIRGIN ISLANDS': 'VI', 'GUAM': 'GU',
  'AMERICAN SAMOA': 'AS', 'NORTHERN MARIANA ISLANDS': 'MP',
};

function resolveStateCode(raw: string | undefined): string | null {
  if (!raw) return null;
  const upper = raw.trim().toUpperCase();
  if (upper.length === 2) return upper; // already an abbreviation
  return STATE_NAME_TO_CODE[upper] ?? null;
}

interface PadusFeature {
  attributes: Record<string, unknown>;
  centroid?: {
    x: number; // longitude (WGS84)
    y: number; // latitude  (WGS84)
  };
}

async function fetchPage(
  desType: string,
  offset: number
): Promise<{ features: PadusFeature[]; hasMore: boolean }> {
  // ArcGIS REST rejects percent-encoded '=' (%3D) in the where clause.
  // Only encode spaces — leave '=' and "'" as literal characters.
  const whereRaw = `Mang_Type='STAT' AND Des_Tp='${desType}'`;
  const where = whereRaw.replace(/ /g, '%20');
  const url = `${PADUS_ENDPOINT}?where=${where}&outFields=*&returnCentroid=true&returnGeometry=false&outSR=4326&resultOffset=${offset}&resultRecordCount=${PAGE_SIZE}&f=json`;
  console.log('[PAD-US] Fetching:', url.slice(0, 120));

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`PAD-US HTTP ${res.status}`);

  const json = await res.json();

  if (json.error) throw new Error(`PAD-US API error: ${JSON.stringify(json.error)}`);

  // Log first feature — shows all field names so we can diagnose issues
  if (offset === 0 && json.features?.length > 0) {
    const sample = json.features[0];
    console.log('[PAD-US] ALL attribute keys:', Object.keys(sample.attributes).join(', '));
    console.log('[PAD-US] State_Nm value:', sample.attributes.State_Nm);
    console.log('[PAD-US] centroid:', JSON.stringify(sample.centroid));
    console.log('[PAD-US] Page count:', json.features.length, '| hasMore:', json.exceededTransferLimit);
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
  let skippedState = 0;
  let skippedCentroid = 0;

  while (true) {
    const { features, hasMore } = await fetchPage(desType, offset);

    for (const f of features) {
      const attrs = f.attributes;
      const name = (attrs.Unit_Nm as string)?.trim();
      if (!name) continue;

      // State_Nm may be a full name ("California") or 2-letter code ("CA")
      const stateCode = resolveStateCode(attrs.State_Nm as string | undefined);
      if (!stateCode) { skippedState++; continue; }

      // Centroid required for map placement
      const lon = f.centroid?.x;
      const lat = f.centroid?.y;
      if (!lon || !lat) { skippedCentroid++; continue; }

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

  console.log(`[PAD-US] ${designation}: kept ${parks.length}, skipped state=${skippedState} centroid=${skippedCentroid}`);
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
