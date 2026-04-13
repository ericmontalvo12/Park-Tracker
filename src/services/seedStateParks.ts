import * as SQLite from 'expo-sqlite';
import { Park } from '../types';
import { batchUpsertParks } from '../db/parks';
import { kvGet, kvSet } from '../db/client';

interface StateParkRecord {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  designation?: string;
}

function buildId(name: string, state: string): string {
  return `state_${state.toLowerCase()}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)}`;
}

export async function seedStateParks(db: SQLite.SQLiteDatabase): Promise<void> {
  const alreadySeeded = await kvGet(db, 'state_parks_seeded');
  if (alreadySeeded === '1') return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data: StateParkRecord[] = require('../../assets/data/state-parks.json');
    const parks: Park[] = data.map((record) => ({
      id: buildId(record.name, record.state),
      source: 'state' as const,
      fullName: record.name,
      description: '',
      stateCodes: record.state,
      latitude: record.latitude,
      longitude: record.longitude,
      designation: record.designation ?? 'State Park',
      imageUrl: null,
      rawJson: JSON.stringify(record),
      lastSynced: Date.now(),
    }));

    await batchUpsertParks(db, parks);
    await kvSet(db, 'state_parks_seeded', '1');
  } catch (error) {
    console.warn('State park seed failed:', error);
  }
}
