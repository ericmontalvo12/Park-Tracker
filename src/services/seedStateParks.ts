import * as SQLite from 'expo-sqlite';
import { batchUpsertParks } from '../db/parks';
import { kvGet, kvSet } from '../db/client';
import { getStaticStateParks, STATE_PARK_COUNT } from '../data/stateParks';

const SEED_VERSION = '2'; // Increment to force re-seed with updated data

export async function seedStateParks(db: SQLite.SQLiteDatabase): Promise<void> {
  const seededVersion = await kvGet(db, 'state_parks_seeded_version');
  if (seededVersion === SEED_VERSION) return;

  try {
    const parks = getStaticStateParks();
    console.log(`Seeding ${parks.length} state parks...`);

    await batchUpsertParks(db, parks);
    await kvSet(db, 'state_parks_seeded_version', SEED_VERSION);
    console.log(`Successfully seeded ${STATE_PARK_COUNT} state parks`);
  } catch (error) {
    console.warn('State park seed failed:', error);
  }
}
