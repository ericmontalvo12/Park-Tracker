import * as SQLite from 'expo-sqlite';
import { kvGet, kvSet } from '../db/client';
import { batchUpsertParks } from '../db/parks';
import { Park } from '../types';

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const CACHE_KEY = 'wikidata_state_parks_v1';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Fetches all US entities of a given Wikidata type (e.g. Q179049 = state park).
// We run separate queries per type so timeouts are less likely.
const QUERIES: Array<{ type: string; qid: string; designation: string }> = [
  { type: 'state park',             qid: 'Q179049',  designation: 'State Park' },
  { type: 'state forest',           qid: 'Q1439621', designation: 'State Forest' },
  { type: 'state beach',            qid: 'Q2074892', designation: 'State Beach' },
  { type: 'state recreation area',  qid: 'Q2319595', designation: 'State Recreation Area' },
  { type: 'state natural area',     qid: 'Q7598388', designation: 'State Natural Area' },
];

interface WDBinding {
  park:       { value: string };
  parkLabel:  { value: string };
  coord?:     { value: string };
  stateAbbr?: { value: string };
}

function buildQuery(qid: string): string {
  return `
SELECT DISTINCT ?park ?parkLabel ?coord ?stateAbbr WHERE {
  ?park wdt:P31/wdt:P279* wd:${qid} .
  ?park wdt:P17 wd:Q30 .
  OPTIONAL { ?park wdt:P625 ?coord . }
  OPTIONAL {
    ?park wdt:P131 ?state .
    ?state wdt:P300 ?stateAbbr .
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

  const parks: Park[] = [];
  for (const b of bindings) {
    const name = b.parkLabel?.value;
    if (!name || name.startsWith('Q')) continue; // skip unlabelled entries

    const coords = b.coord ? parseCoord(b.coord.value) : null;
    const rawState = b.stateAbbr?.value ?? '';
    const stateCode = rawState.startsWith('US-') ? rawState.slice(3) : rawState;

    parks.push({
      id: `wiki_${b.park.value.split('/').pop()}`,
      source: 'state',
      fullName: name,
      description: '',
      stateCodes: stateCode,
      latitude: coords?.lat ?? null,
      longitude: coords?.lon ?? null,
      designation,
      imageUrl: null,
      rawJson: '',
      lastSynced: Date.now(),
    });
  }
  return parks;
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
