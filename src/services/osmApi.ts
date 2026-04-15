import * as SQLite from 'expo-sqlite';
import { kvGet, kvSet } from '../db/client';
import { batchUpsertParks } from '../db/parks';
import { Park } from '../types';

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const CACHE_KEY = 'osm_state_parks_v1';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Query for US protected areas / nature reserves whose name contains
// common state-park keywords. Using regex on name keeps the result set
// focused and avoids timing out on a full-country protected_area dump.
const OVERPASS_QUERY = `[out:json][timeout:180];
area["ISO3166-1"="US"][admin_level=2]->.usa;
(
  relation["boundary"="protected_area"][name~"State Park|State Forest|State Beach|State Recreation Area|State Natural Area|State Preserve|State Reserve|State Seashore|State Wilderness",i](area.usa);
  relation["leisure"="nature_reserve"][name~"State Park|State Forest|State Beach|State Recreation Area|State Natural Area|State Preserve|State Reserve",i](area.usa);
  way["boundary"="protected_area"][name~"State Park|State Forest|State Beach|State Recreation Area|State Natural Area|State Preserve|State Reserve",i](area.usa);
);
out center tags;`;

// Full state name → 2-letter postal code
const STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR',
  california: 'CA', colorado: 'CO', connecticut: 'CT', delaware: 'DE',
  florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID',
  illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS',
  kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS',
  missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK',
  oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY', 'district of columbia': 'DC',
};

interface OsmElement {
  type: string;
  id: number;
  center?: { lat: number; lon: number };
  tags: Record<string, string>;
}

// Try every common OSM tag that might carry state info
function extractStateCode(tags: Record<string, string>): string | null {
  // ISO3166-2 on the park itself e.g. "US-FL"
  const iso = tags['ISO3166-2'];
  if (iso?.startsWith('US-') && iso.length === 5) return iso.slice(3);

  // addr:state or is_in:state_code
  const sc = tags['addr:state'] || tags['is_in:state_code'];
  if (sc && sc.length === 2) return sc.toUpperCase();

  // Full state name tags
  const fullName = (tags['is_in:state'] || tags['addr:state_name'] || '').toLowerCase().trim();
  if (fullName && STATE_NAME_TO_CODE[fullName]) return STATE_NAME_TO_CODE[fullName];

  // Operator tag e.g. "Florida State Parks", "NY State DEC"
  const operator = (tags['operator'] || tags['operator:en'] || '').toLowerCase();
  for (const [name, code] of Object.entries(STATE_NAME_TO_CODE)) {
    if (operator.includes(name)) return code;
  }

  return null;
}

function inferDesignation(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('state forest')) return 'State Forest';
  if (n.includes('state beach')) return 'State Beach';
  if (n.includes('state recreation area') || n.includes('state rec area')) return 'State Recreation Area';
  if (n.includes('state natural area')) return 'State Natural Area';
  if (n.includes('state preserve') || n.includes('state reserve')) return 'State Preserve';
  if (n.includes('state seashore')) return 'State Seashore';
  if (n.includes('state wilderness')) return 'State Wilderness';
  return 'State Park';
}

export async function syncStateParksFromOSM(
  db: SQLite.SQLiteDatabase,
  onProgress?: (msg: string) => void
): Promise<void> {
  const lastSync = await kvGet(db, CACHE_KEY);
  if (lastSync && Date.now() - parseInt(lastSync) < CACHE_TTL_MS) return;

  onProgress?.('Querying OpenStreetMap for state parks…');
  console.log('[OSM] Starting Overpass query…');

  const res = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
  });

  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);

  const json = await res.json();
  const elements: OsmElement[] = json.elements ?? [];
  console.log('[OSM] Raw elements returned:', elements.length);

  const parks: Park[] = [];
  const seen = new Set<string>();
  let skippedNoCenter = 0;
  let skippedNoState = 0;

  for (const el of elements) {
    const name = el.tags?.name?.trim();
    if (!name) continue;

    if (!el.center) { skippedNoCenter++; continue; }
    const lat = el.center.lat;
    const lon = el.center.lon;

    const stateCode = extractStateCode(el.tags);
    if (!stateCode) { skippedNoState++; continue; }

    const key = `${name}|${stateCode}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const designation = inferDesignation(name);

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 50);

    parks.push({
      id:          `osm_${el.type[0]}${el.id}`,
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

  console.log(`[OSM] Kept: ${parks.length} | skipped no-center: ${skippedNoCenter} | skipped no-state: ${skippedNoState}`);

  await db.runAsync("DELETE FROM parks WHERE source = 'state'");
  if (parks.length > 0) await batchUpsertParks(db, parks);

  if (parks.length > 0) await kvSet(db, CACHE_KEY, String(Date.now()));
  onProgress?.(`Synced ${parks.length} state parks from OpenStreetMap`);
}
