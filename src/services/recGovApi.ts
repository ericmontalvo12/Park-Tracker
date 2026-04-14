import * as SQLite from 'expo-sqlite';
import { Park } from '../types';
import { batchUpsertParks } from '../db/parks';
import { kvGet, kvSet } from '../db/client';

const RECGOV_BASE_URL = 'https://ridb.recreation.gov/api/v1';
const RECGOV_API_KEY = process.env.EXPO_PUBLIC_RECGOV_API_KEY ?? '';

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

function normalizeRecArea(raw: RecGovRecArea, stateCode: string): Park | null {
  // Skip entries with no coordinates
  if (!raw.RecAreaLatitude || !raw.RecAreaLongitude ||
      raw.RecAreaLatitude === 0 || raw.RecAreaLongitude === 0) {
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
    designation: 'State Park',
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

  const alreadySynced = await kvGet(db, 'recgov_state_parks_synced_v1');
  if (alreadySynced === '1') return;

  try {
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

    await kvSet(db, 'recgov_state_parks_synced_v1', '1');
    // Clear old static seed flag so old data is replaced
    await kvSet(db, 'state_parks_seeded', '0');
  } catch (error) {
    console.warn('Recreation.gov sync failed:', error);
  }
}
