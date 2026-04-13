import * as SQLite from 'expo-sqlite';
import { Park } from '../types';
import { batchUpsertParks } from '../db/parks';
import { kvGet, kvSet } from '../db/client';

const NPS_API_KEY = process.env.EXPO_PUBLIC_NPS_API_KEY ?? 'DEMO_KEY';
const NPS_BASE_URL = 'https://developer.nps.gov/api/v1';
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

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
  const lastSync = await kvGet(db, 'nps_last_sync');
  if (lastSync && Date.now() - parseInt(lastSync, 10) < SYNC_INTERVAL_MS) {
    return; // Still fresh
  }

  try {
    // NPS has ~500 parks total — fetch in one call
    const parks = await fetchNpsPage(0, 500);
    const normalized = parks.map(normalizeNpsPark);
    await batchUpsertParks(db, normalized);
    await kvSet(db, 'nps_last_sync', Date.now().toString());
  } catch (error) {
    console.warn('NPS sync failed, using cached data:', error);
    // Silently fall through — cached SQLite data will still be shown
  }
}
