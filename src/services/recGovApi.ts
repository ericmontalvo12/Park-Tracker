import * as SQLite from 'expo-sqlite';
import { Park } from '../types';
import { batchUpsertParks } from '../db/parks';
import { kvGet, kvSet } from '../db/client';

const RECGOV_BASE_URL = 'https://ridb.recreation.gov/api/v1';
const RECGOV_API_KEY =
  process.env.EXPO_PUBLIC_RECGOV_API_KEY ?? '5254d6dc-a904-48e0-86a5-decec7d77dfa';

// All US state codes to fetch parks for
const US_STATE_CODES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

interface RecGovRecArea {
  RecAreaID: string;
  RecAreaName: string;
  RecAreaDescription: string;
  RecAreaLatitude: number;
  RecAreaLongitude: number;
  RecAreaFeeDescription: string;
  AddressStateCode: string;
  GEOJSON?: {
    TYPE: string;
    COORDINATES: number[];
  };
  MEDIA?: Array<{ URL: string; Title: string; IsPrimary: boolean }>;
  RECAREAADDRESS?: Array<{ AddressStateCode: string }>;
}

// Derive a human-readable designation from the area name rather than
// labelling every RecGov entry "State Park".
function inferDesignation(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('national wildlife refuge'))          return 'National Wildlife Refuge';
  if (n.includes('national marine sanctuary'))         return 'National Marine Sanctuary';
  if (n.includes('national seashore'))                 return 'National Seashore';
  if (n.includes('national lakeshore'))                return 'National Lakeshore';
  if (n.includes('national recreation area'))          return 'National Recreation Area';
  if (n.includes('national monument'))                 return 'National Monument';
  if (n.includes('national forest'))                   return 'National Forest';
  if (n.includes('national grassland'))                return 'National Grassland';
  if (n.includes('national estuarine research reserve')) return 'National Estuarine Reserve';
  if (n.includes('outstanding natural area'))          return 'Outstanding Natural Area';
  if (n.includes('wilderness'))                        return 'Wilderness Area';
  if (n.includes('state park'))                        return 'State Park';
  if (n.includes('state forest'))                      return 'State Forest';
  if (n.includes('state beach'))                       return 'State Beach';
  if (n.includes('state recreation area'))             return 'State Recreation Area';
  if (n.includes('state natural area'))                return 'State Natural Area';
  if (n.includes('wildlife refuge') || n.includes('wildlife management')) return 'Wildlife Refuge';
  if (n.includes('wildlife area'))                     return 'Wildlife Area';
  if (n.includes('preserve'))                          return 'Nature Preserve';
  if (n.includes('nature reserve') || n.includes('nature area')) return 'Nature Reserve';
  return 'Recreation Area';
}

// Designations already covered by the NPS API sync — skip RecGov duplicates.
const NPS_COVERED_DESIGNATIONS = new Set([
  'National Park',
  'National Monument',
  'National Recreation Area',
  'National Preserve',
  'National Seashore',
  'National Lakeshore',
  'National Parkway',
  'National Battlefield',
  'National Military Park',
  'National Scenic Trail',
  'National Historic Trail',
  'National Volcanic Monument',
  'National Reserve',
]);

// Sub-facility keywords — these are individual features within a park,
// not destinations worth tracking on their own.
const SUB_FACILITY_PATTERNS = [
  /\btrail$/i,
  /\btrailhead\b/i,
  /\bcampground\b/i,
  /\bcamp\s*site/i,
  /\bpicnic\s*area\b/i,
  /\bboat\s*launch\b/i,
  /\bboat\s*ramp\b/i,
  /\bparking\s*area\b/i,
  /\bvisitor\s*center\b/i,
  /\bday\s*use\s*area\b/i,
  /\bgroup\s*camp\b/i,
  /\bequestrian\s*camp/i,
  /\bfire\s*lookout\b/i,
  /\bprimitive\s*camp/i,
];

function isSubFacility(name: string): boolean {
  return SUB_FACILITY_PATTERNS.some(re => re.test(name));
}

function normalizeRecArea(raw: RecGovRecArea, stateCode: string): Park | null {
  // Skip entries with no coordinates
  if (!raw.RecAreaLatitude || !raw.RecAreaLongitude ||
      raw.RecAreaLatitude === 0 || raw.RecAreaLongitude === 0) {
    return null;
  }

  // Skip individual trails, campgrounds, picnic areas, etc.
  if (isSubFacility(raw.RecAreaName)) {
    return null;
  }

  // Skip NPS-managed parks — they're already in the database from the NPS sync.
  const designation = inferDesignation(raw.RecAreaName);
  if (NPS_COVERED_DESIGNATIONS.has(designation)) {
    return null;
  }

  const primaryImage = raw.MEDIA?.find(m => m.IsPrimary)?.URL
    ?? raw.MEDIA?.[0]?.URL
    ?? null;

  return {
    id: `recgov_${raw.RecAreaID}`,
    source: 'state',
    fullName: raw.RecAreaName,
    description: raw.RecAreaDescription ?? '',
    stateCodes: stateCode,
    latitude: raw.RecAreaLatitude,
    longitude: raw.RecAreaLongitude,
    designation,
    imageUrl: primaryImage,
    rawJson: JSON.stringify(raw),
    lastSynced: Date.now(),
  };
}

async function fetchRecAreasForState(stateCode: string): Promise<RecGovRecArea[]> {
  const results: RecGovRecArea[] = [];
  let offset = 0;
  const limit = 50;
  const maxPages = 10; // cap at 500 per state

  for (let page = 0; page < maxPages; page++) {
    const url = `${RECGOV_BASE_URL}/recareas?state=${stateCode}&limit=${limit}&offset=${offset}&apikey=${RECGOV_API_KEY}&full=true`;
    const response = await fetch(url);
    if (!response.ok) break;

    const data = await response.json();
    const items: RecGovRecArea[] = data.RECDATA ?? [];
    results.push(...items);

    if (items.length < limit) break; // no more pages
    offset += limit;
  }

  return results;
}

export async function syncRecGovStateParks(
  db: SQLite.SQLiteDatabase,
  onProgress?: (state: string, index: number, total: number) => void
): Promise<void> {
  if (!RECGOV_API_KEY) {
    console.warn('No Recreation.gov API key found. Add EXPO_PUBLIC_RECGOV_API_KEY to your .env file.');
    return;
  }

  const alreadySynced = await kvGet(db, 'recgov_state_parks_synced_v5');
  if (alreadySynced === '1') return;

  try {
    // Wipe all existing state-park records so stale/filtered entries don't linger.
    await db.runAsync("DELETE FROM parks WHERE source = 'state'");

    for (let i = 0; i < US_STATE_CODES.length; i++) {
      const stateCode = US_STATE_CODES[i];
      onProgress?.(stateCode, i, US_STATE_CODES.length);

      const recAreas = await fetchRecAreasForState(stateCode);
      const parks = recAreas
        .map(r => normalizeRecArea(r, stateCode))
        .filter((p): p is Park => p !== null);

      if (parks.length > 0) {
        await batchUpsertParks(db, parks);
      }
    }

    await kvSet(db, 'recgov_state_parks_synced_v5', '1');
    // Clear old static seed flag so old data is replaced
    await kvSet(db, 'state_parks_seeded', '0');
  } catch (error) {
    console.warn('Recreation.gov sync failed:', error);
  }
}
