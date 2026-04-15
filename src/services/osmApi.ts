import * as SQLite from 'expo-sqlite';
import { kvGet, kvSet } from '../db/client';
import { batchUpsertParks } from '../db/parks';
import { Park } from '../types';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const FETCH_TIMEOUT_MS = 30_000; // abort if no response in 30s
const CACHE_KEY = 'osm_state_parks_v8';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Sequential — Overpass rate-limits concurrent requests (429)
const DELAY_MS = 1500; // between states

const US_STATE_CODES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

const NAME_PATTERN = 'State Park|State Forest|State Beach|State Recreation Area|State Preserve|State Reserve';

// Bounding boxes (south,west,north,east) for every state.
// Using bbox instead of area polygons avoids Overpass timeouts caused by
// complex coastline polygons (AK, HI, FL, CA, etc.).
const STATE_BBOX: Record<string, string> = {
  AL:'30.1,-88.5,35.1,-84.9', AK:'51.2,-179.9,71.5,-129.7', AZ:'31.3,-114.9,37.1,-109.0',
  AR:'33.0,-94.7,36.5,-89.6', CA:'32.5,-124.5,42.1,-114.1', CO:'37.0,-109.1,41.1,-102.0',
  CT:'40.9,-73.8,42.1,-71.8', DE:'38.4,-75.8,39.9,-75.0',   FL:'24.4,-87.7,31.1,-79.9',
  GA:'30.3,-85.7,35.1,-80.8', HI:'18.9,-160.3,22.3,-154.8', ID:'42.0,-117.3,49.1,-111.0',
  IL:'36.9,-91.6,42.6,-87.5', IN:'37.7,-88.2,41.8,-84.7',   IA:'40.3,-96.7,43.6,-90.1',
  KS:'37.0,-102.1,40.1,-94.6', KY:'36.5,-89.6,39.2,-82.0',  LA:'28.9,-94.1,33.1,-88.8',
  ME:'43.0,-71.1,47.5,-67.0', MD:'37.9,-79.5,39.8,-75.1',   MA:'41.2,-73.6,42.9,-69.9',
  MI:'41.7,-90.5,48.3,-82.4', MN:'43.5,-97.3,49.4,-89.5',   MS:'30.1,-91.7,35.1,-88.1',
  MO:'36.0,-95.8,40.7,-89.1', MT:'44.3,-116.1,49.1,-104.0', NE:'40.0,-104.1,43.1,-95.3',
  NV:'35.0,-120.1,42.1,-114.0', NH:'42.7,-72.6,45.4,-70.7', NJ:'38.9,-75.6,41.4,-73.9',
  NM:'31.3,-109.1,37.1,-103.0', NY:'40.5,-79.8,45.1,-71.9', NC:'33.8,-84.4,36.6,-75.5',
  ND:'45.9,-104.1,49.1,-96.6', OH:'38.4,-84.9,42.4,-80.5',  OK:'33.6,-103.1,37.1,-94.4',
  OR:'42.0,-124.6,46.3,-116.5', PA:'39.7,-80.6,42.3,-74.7', RI:'41.1,-71.9,42.1,-71.1',
  SC:'32.0,-83.4,35.3,-78.5', SD:'42.5,-104.1,46.0,-96.4',  TN:'35.0,-90.4,36.7,-81.6',
  TX:'25.8,-106.7,36.6,-93.5', UT:'37.0,-114.1,42.1,-109.0', VT:'42.7,-73.5,45.1,-71.5',
  VA:'36.5,-83.7,39.5,-75.2', WA:'45.5,-124.8,49.1,-116.9', WV:'37.2,-82.7,40.7,-77.7',
  WI:'42.5,-92.9,47.1,-86.2', WY:'41.0,-111.1,45.1,-104.0',
};

function buildStateQuery(stateCode: string): string {
  const bbox = STATE_BBOX[stateCode] ?? '24.0,-125.0,50.0,-66.0'; // fallback: continental US
  return `[out:json][timeout:45];
(
  relation["boundary"="protected_area"][name~"${NAME_PATTERN}",i](${bbox});
  relation["leisure"="nature_reserve"][name~"${NAME_PATTERN}",i](${bbox});
);
out center tags;`;
}

const STATE_NAME_TO_CODE: Record<string, string> = {
  alabama:'AL',alaska:'AK',arizona:'AZ',arkansas:'AR',california:'CA',
  colorado:'CO',connecticut:'CT',delaware:'DE',florida:'FL',georgia:'GA',
  hawaii:'HI',idaho:'ID',illinois:'IL',indiana:'IN',iowa:'IA',kansas:'KS',
  kentucky:'KY',louisiana:'LA',maine:'ME',maryland:'MD',massachusetts:'MA',
  michigan:'MI',minnesota:'MN',mississippi:'MS',missouri:'MO',montana:'MT',
  nebraska:'NE',nevada:'NV','new hampshire':'NH','new jersey':'NJ',
  'new mexico':'NM','new york':'NY','north carolina':'NC','north dakota':'ND',
  ohio:'OH',oklahoma:'OK',oregon:'OR',pennsylvania:'PA','rhode island':'RI',
  'south carolina':'SC','south dakota':'SD',tennessee:'TN',texas:'TX',
  utah:'UT',vermont:'VT',virginia:'VA',washington:'WA','west virginia':'WV',
  wisconsin:'WI',wyoming:'WY','district of columbia':'DC',
};

interface OsmElement {
  type: string;
  id: number;
  center?: { lat: number; lon: number };
  tags: Record<string, string>;
}

function extractStateCode(tags: Record<string, string>, queryState: string): string {
  // Prefer the state we queried — most reliable signal
  if (queryState) return queryState;

  const iso = tags['ISO3166-2'];
  if (iso?.startsWith('US-') && iso.length === 5) return iso.slice(3);

  const sc = tags['addr:state'] || tags['is_in:state_code'];
  if (sc?.length === 2) return sc.toUpperCase();

  const full = (tags['is_in:state'] || tags['addr:state_name'] || '').toLowerCase().trim();
  if (full) return STATE_NAME_TO_CODE[full] ?? queryState;

  const op = (tags['operator'] || '').toLowerCase();
  for (const [name, code] of Object.entries(STATE_NAME_TO_CODE)) {
    if (op.includes(name)) return code;
  }

  return queryState;
}

function inferDesignation(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('state forest'))          return 'State Forest';
  if (n.includes('state beach'))           return 'State Beach';
  if (n.includes('state recreation area')) return 'State Recreation Area';
  if (n.includes('state natural area'))    return 'State Natural Area';
  if (n.includes('state preserve'))        return 'State Preserve';
  if (n.includes('state reserve'))         return 'State Reserve';
  if (n.includes('state seashore'))        return 'State Seashore';
  if (n.includes('state wilderness'))      return 'State Wilderness';
  return 'State Park';
}

async function fetchStateParks(stateCode: string): Promise<OsmElement[]> {
  const query = buildStateQuery(stateCode);
  const body = `data=${encodeURIComponent(query)}`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.status === 504 || res.status === 429 || res.status === 503) continue;
      if (!res.ok) { console.warn(`[OSM] ${stateCode} HTTP ${res.status}`); continue; }
      const json = await res.json();
      return json.elements ?? [];
    } catch {
      clearTimeout(timer);
      // timed out or network error — try next mirror
    }
  }
  console.warn(`[OSM] ${stateCode} skipped`);
  return [];
}

export async function syncStateParksFromOSM(
  db: SQLite.SQLiteDatabase,
  onProgress?: (msg: string) => void
): Promise<void> {
  const lastSync = await kvGet(db, CACHE_KEY);
  if (lastSync && Date.now() - parseInt(lastSync) < CACHE_TTL_MS) return;

  await db.runAsync("DELETE FROM parks WHERE source = 'state'");

  const seen = new Set<string>();
  let total = 0;

  // Process one state at a time to stay within Overpass rate limits
  for (let i = 0; i < US_STATE_CODES.length; i++) {
    const stateCode = US_STATE_CODES[i];
    onProgress?.(`Loading ${stateCode}… (${i + 1}/${US_STATE_CODES.length})`);

    const elements = await fetchStateParks(stateCode);
    const parks: Park[] = [];

    for (const el of elements) {
      const name = el.tags?.name?.trim();
      if (!name || !el.center) continue;

      const sc = extractStateCode(el.tags, stateCode);
      const key = `${name}|${sc}`;
      if (seen.has(key)) continue;
      seen.add(key);

      parks.push({
        id:          `osm_${el.type[0]}${el.id}`,
        source:      'state',
        fullName:    name,
        description: '',
        stateCodes:  sc,
        latitude:    el.center.lat,
        longitude:   el.center.lon,
        designation: inferDesignation(name),
        imageUrl:    null,
        rawJson:     '',
        lastSynced:  Date.now(),
      });
    }

    if (parks.length > 0) await batchUpsertParks(db, parks);
    total += parks.length;
    console.log(`[OSM] ${stateCode} → ${parks.length} parks (total ${total})`);

    // Respect Overpass rate limit between requests
    if (i < US_STATE_CODES.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  if (total > 0) await kvSet(db, CACHE_KEY, String(Date.now()));
  onProgress?.(`Synced ${total} state parks`);
}
