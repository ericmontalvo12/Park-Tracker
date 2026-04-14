import * as SQLite from 'expo-sqlite';
import { kvGet, kvSet } from '../db/client';
import { batchUpsertParks } from '../db/parks';
import { Park } from '../types';

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const CACHE_KEY = 'wikidata_state_parks_v3'; // bumped — added image fetch
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Fetches all US entities of a given Wikidata type (e.g. Q179049 = state park).
// We run separate queries per type so timeouts are less likely.
const QUERIES: Array<{ type: string; qid: string; designation: string }> = [
  { type: 'state park',            qid: 'Q179049',  designation: 'State Park' },
  { type: 'state forest',          qid: 'Q1439621', designation: 'State Forest' },
  { type: 'state beach',           qid: 'Q2074892', designation: 'State Beach' },
  { type: 'state recreation area', qid: 'Q2319595', designation: 'State Recreation Area' },
  { type: 'state natural area',    qid: 'Q7598388', designation: 'State Natural Area' },
];

interface WDBinding {
  park:       { value: string };
  parkLabel:  { value: string };
  coord?:     { value: string };
  stateAbbr?: { value: string };
  image?:     { value: string };
}

// Two-hop P131 lookup (park → [county →] state) so parks filed under a county
// still get a state code. The UNION keeps the query fast by only going one
// extra level rather than using unbounded wdt:P131+.
function buildQuery(qid: string): string {
  return `
SELECT DISTINCT ?park ?parkLabel ?coord ?stateAbbr ?image WHERE {
  ?park wdt:P31/wdt:P279* wd:${qid} .
  ?park wdt:P17 wd:Q30 .
  OPTIONAL { ?park wdt:P625 ?coord . }
  OPTIONAL { ?park wdt:P18 ?image . }
  OPTIONAL {
    {
      ?park wdt:P131 ?loc .
    } UNION {
      ?park wdt:P131 ?mid .
      ?mid  wdt:P131 ?loc .
    }
    ?loc wdt:P300 ?stateAbbr .
    FILTER(STRSTARTS(?stateAbbr, "US-"))
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 5000`.trim();
}

// Wikidata coord format: "Point(lon lat)"
function parseCoord(s: string): { lat: number; lon: number } | null {
  const m = s.match(/Point\(([+-]?\d+\.?\d*)\s([+-]?\d+\.?\d*)\)/);
  if (!m) return null;
  return { lon: parseFloat(m[1]), lat: parseFloat(m[2]) };
}

async function fetchParksOfType(
  designation: string,
  qid: string
): Promise<Park[]> {
  const query = buildQuery(qid);
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;

  const res = await fetch(url, {
    headers: { Accept: 'application/sparql-results+json' },
  });
  if (!res.ok) throw new Error(`Wikidata ${res.status}`);

  const json = await res.json();
  const bindings: WDBinding[] = json.results?.bindings ?? [];

  // Deduplicate by Wikidata QID within this result set.
  // The two-hop UNION query can return multiple rows for the same park
  // (one per matched ?loc). We keep the row that has a state code;
  // if none have one, we keep the first row we saw.
  const parkMap = new Map<string, Park>();

  for (const b of bindings) {
    const name = b.parkLabel?.value;
    if (!name || name.startsWith('Q')) continue; // skip unlabelled entries

    const coords = b.coord ? parseCoord(b.coord.value) : null;
    // Require coordinates — parks without them can't be mapped or located.
    if (!coords) continue;

    const rawState = b.stateAbbr?.value ?? '';
    const stateCode = rawState.startsWith('US-') ? rawState.slice(3) : rawState;
    const id = `wiki_${b.park.value.split('/').pop()}`;

    const existing = parkMap.get(id);
    // Prefer entries that have a state code over those without.
    if (existing && existing.stateCodes && !stateCode) continue;

    // wdt:P18 returns a Wikimedia Commons URI usable directly as an image URL.
    // e.g. http://commons.wikimedia.org/wiki/Special:FilePath/Park.jpg
    const imageUrl = b.image?.value ?? existing?.imageUrl ?? null;

    parkMap.set(id, {
      id,
      source: 'state',
      fullName: name,
      description: '',
      stateCodes: stateCode,
      latitude: coords.lat,
      longitude: coords.lon,
      designation,
      imageUrl,
      rawJson: '',
      lastSynced: Date.now(),
    });
  }

  return Array.from(parkMap.values());
}

export async function syncStateParksfromWikidata(
  db: SQLite.SQLiteDatabase,
  onProgress?: (msg: string) => void
): Promise<void> {
  const lastSync = await kvGet(db, CACHE_KEY);
  if (lastSync && Date.now() - parseInt(lastSync) < CACHE_TTL_MS) return;

  // Wipe old state park data before fresh sync
  await db.runAsync("DELETE FROM parks WHERE source = 'state'");

  let total = 0;
  for (const { type, qid, designation } of QUERIES) {
    onProgress?.(`Loading ${type}s…`);
    try {
      const parks = await fetchParksOfType(designation, qid);
      if (parks.length > 0) await batchUpsertParks(db, parks);
      total += parks.length;
      onProgress?.(`Loaded ${total} state parks so far…`);
    } catch (err) {
      console.warn(`Wikidata fetch failed for ${type}:`, err);
    }
  }

  await kvSet(db, CACHE_KEY, String(Date.now()));
  onProgress?.(`Synced ${total} state parks`);
}
