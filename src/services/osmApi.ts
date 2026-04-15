import * as SQLite from 'expo-sqlite';
import { kvGet, kvSet } from '../db/client';
import { batchUpsertParks } from '../db/parks';
import { Park } from '../types';

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const CACHE_KEY = 'osm_state_parks_v3';
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

// Shorter pattern = faster regex in Overpass; relations only (no ways) = less data
const NAME_PATTERN = 'State Park|State Forest|State Beach|State Recreation Area|State Preserve|State Reserve';

function buildStateQuery(stateCode: string): string {
  return `[out:json][timeout:45];
area["ISO3166-2"="US-${stateCode}"][admin_level=4]->.s;
(
  relation["boundary"="protected_area"][name~"${NAME_PATTERN}",i](area.s);
  relation["leisure"="nature_reserve"][name~"${NAME_PATTERN}",i](area.s);
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

  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) await new Promise(r => setTimeout(r, attempt * 2000));
    try {
      const res = await fetch(OVERPASS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (res.status === 429 || res.status === 503) continue; // retry
      if (!res.ok) { console.warn(`[OSM] ${stateCode} HTTP ${res.status}`); return []; }
      const json = await res.json();
      return json.elements ?? [];
    } catch {
      // network error — retry
    }
  }
  console.warn(`[OSM] ${stateCode} failed after 3 attempts`);
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
