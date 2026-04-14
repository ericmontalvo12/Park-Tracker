import * as SQLite from 'expo-sqlite';
import { Park } from '../types';
import { batchUpsertParks } from '../db/parks';
import { kvGet, kvSet } from '../db/client';

const NPS_API_KEY =
  process.env.EXPO_PUBLIC_NPS_API_KEY ?? 'RZY4aIrQ5963UKF6M8Yde34McZDrHWqcZtnE3IdA';
const NPS_BASE_URL = 'https://developer.nps.gov/api/v1';
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Only the 63 congressionally-designated National Parks.
// "National Park & Preserve" covers parks like Denali, Wrangell-St. Elias, etc.
// that are counted in the official 63.
const NATIONAL_PARK_DESIGNATIONS = new Set([
  'National Park',
  'National Park & Preserve',
]);

interface NpsApiPark {
  parkCode: string;
  fullName: string;
  description: string;
  states: string;
  latitude: string;
  longitude: string;
  designation: string;
  images: Array<{ url: string; title: string }>;
  entranceFees: Array<{ cost: string; description: string; title: string }>;
  operatingHours: Array<{ name: string; standardHours: Record<string, string> }>;
}

function normalizeNpsPark(raw: NpsApiPark): Park {
  return {
    id: raw.parkCode,
    source: 'nps',
    fullName: raw.fullName,
    description: raw.description,
    stateCodes: raw.states,
    latitude: raw.latitude ? parseFloat(raw.latitude) : null,
    longitude: raw.longitude ? parseFloat(raw.longitude) : null,
    designation: raw.designation,
    imageUrl: raw.images?.[0]?.url ?? null,
    rawJson: JSON.stringify(raw),
    lastSynced: Date.now(),
  };
}

async function fetchNpsPage(start: number, limit: number): Promise<NpsApiPark[]> {
  const url = `${NPS_BASE_URL}/parks?limit=${limit}&start=${start}&api_key=${NPS_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`NPS API error: ${response.status}`);
  const data = await response.json();
  return data.data as NpsApiPark[];
}

export async function syncNpsParks(db: SQLite.SQLiteDatabase): Promise<void> {
  // v2 cache key forces a re-sync after the outdoor-only filter was added
  const lastSync = await kvGet(db, 'nps_last_sync_v3');
  if (lastSync && Date.now() - parseInt(lastSync, 10) < SYNC_INTERVAL_MS) {
    return; // Still fresh
  }

  try {
    const allParks = await fetchNpsPage(0, 500);
    const nationalParks = allParks.filter(p => NATIONAL_PARK_DESIGNATIONS.has(p.designation));
    const normalized = nationalParks.map(normalizeNpsPark);

    // Delete all NPS rows first so stale non-park entries don't linger.
    await db.runAsync("DELETE FROM parks WHERE source = 'nps'");
    await batchUpsertParks(db, normalized);
    await kvSet(db, 'nps_last_sync_v3', Date.now().toString());
  } catch (error) {
    console.warn('NPS sync failed, using cached data:', error);
  }
}
