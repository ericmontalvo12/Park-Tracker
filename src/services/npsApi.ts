import * as SQLite from 'expo-sqlite';
import { Park } from '../types';
import { batchUpsertParks } from '../db/parks';
import { kvGet, kvSet } from '../db/client';

const NPS_API_KEY =
  process.env.EXPO_PUBLIC_NPS_API_KEY ?? 'RZY4aIrQ5963UKF6M8Yde34McZDrHWqcZtnE3IdA';
const NPS_BASE_URL = 'https://developer.nps.gov/api/v1';
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// The 63 congressionally-designated National Parks by official NPS park code.
// Using park codes instead of designation strings avoids mismatches caused by
// API variations (e.g. "National Park and Preserve" vs "National Park & Preserve").
const OFFICIAL_63_PARK_CODES = new Set([
  'acad', // Acadia
  'npsa', // National Park of American Samoa
  'arch', // Arches
  'badl', // Badlands
  'bibe', // Big Bend
  'bisc', // Biscayne
  'blca', // Black Canyon of the Gunnison
  'brca', // Bryce Canyon
  'cany', // Canyonlands
  'care', // Capitol Reef
  'cave', // Carlsbad Caverns
  'chis', // Channel Islands
  'cong', // Congaree
  'crla', // Crater Lake
  'cuva', // Cuyahoga Valley
  'deva', // Death Valley
  'dena', // Denali
  'drto', // Dry Tortugas
  'ever', // Everglades
  'gaar', // Gates of the Arctic
  'jeff', // Gateway Arch
  'glac', // Glacier
  'glba', // Glacier Bay
  'grca', // Grand Canyon
  'grte', // Grand Teton
  'grba', // Great Basin
  'grsa', // Great Sand Dunes
  'grsm', // Great Smoky Mountains
  'gumo', // Guadalupe Mountains
  'hale', // Haleakalā
  'havo', // Hawaiʻi Volcanoes
  'hosp', // Hot Springs
  'indu', // Indiana Dunes
  'isro', // Isle Royale
  'jotr', // Joshua Tree
  'katm', // Katmai
  'kefj', // Kenai Fjords
  'seki', // Sequoia & Kings Canyon (NPS API combines both under one entry)
  'kova', // Kobuk Valley
  'lacl', // Lake Clark
  'lavo', // Lassen Volcanic
  'maca', // Mammoth Cave
  'meve', // Mesa Verde
  'mora', // Mount Rainier
  'neri', // New River Gorge
  'noca', // North Cascades
  'olym', // Olympic
  'pefo', // Petrified Forest
  'pinn', // Pinnacles
  'redw', // Redwood
  'romo', // Rocky Mountain
  'sagu', // Saguaro
  // 'sequ' — covered by 'seki' above
  'shen', // Shenandoah
  'thro', // Theodore Roosevelt
  'viis', // Virgin Islands
  'voya', // Voyageurs
  'whsa', // White Sands
  'wica', // Wind Cave
  'wrst', // Wrangell-St. Elias
  'yell', // Yellowstone
  'yose', // Yosemite
  'zion', // Zion
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
  const lastSync = await kvGet(db, 'nps_last_sync_v6');
  if (lastSync && Date.now() - parseInt(lastSync, 10) < SYNC_INTERVAL_MS) {
    return; // Still fresh
  }

  try {
    const allParks = await fetchNpsPage(0, 500);
    const foundCodes = new Set(allParks.map(p => p.parkCode));
    const missingCodes = [...OFFICIAL_63_PARK_CODES].filter(c => !foundCodes.has(c));
    if (missingCodes.length) console.warn('[NPS] Park codes not found in API:', missingCodes);
    const nationalParks = allParks.filter(p => OFFICIAL_63_PARK_CODES.has(p.parkCode));
    const normalized = nationalParks.map(normalizeNpsPark);

    // Delete all NPS rows first so stale non-park entries don't linger.
    await db.runAsync("DELETE FROM parks WHERE source = 'nps'");
    await batchUpsertParks(db, normalized);
    await kvSet(db, 'nps_last_sync_v6', Date.now().toString());
  } catch (error) {
    console.warn('NPS sync failed, using cached data:', error);
  }
}
