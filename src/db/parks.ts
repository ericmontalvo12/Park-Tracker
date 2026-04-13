import * as SQLite from 'expo-sqlite';
import { Park } from '../types';

function rowToPark(row: any): Park {
  return {
    id: row.id,
    source: row.source,
    fullName: row.full_name,
    description: row.description ?? '',
    stateCodes: row.state_codes ?? '',
    latitude: row.latitude,
    longitude: row.longitude,
    designation: row.designation ?? '',
    imageUrl: row.image_url,
    rawJson: row.raw_json ?? '{}',
    lastSynced: row.last_synced ?? 0,
  };
}

export async function upsertPark(db: SQLite.SQLiteDatabase, park: Park): Promise<void> {
  await db.runAsync(
    `INSERT INTO parks (id, source, full_name, description, state_codes, latitude, longitude, designation, image_url, raw_json, last_synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       full_name   = excluded.full_name,
       description = excluded.description,
       state_codes = excluded.state_codes,
       latitude    = excluded.latitude,
       longitude   = excluded.longitude,
       designation = excluded.designation,
       image_url   = excluded.image_url,
       raw_json    = excluded.raw_json,
       last_synced = excluded.last_synced`,
    [park.id, park.source, park.fullName, park.description, park.stateCodes,
     park.latitude, park.longitude, park.designation, park.imageUrl, park.rawJson, park.lastSynced]
  );
}

export async function batchUpsertParks(db: SQLite.SQLiteDatabase, parks: Park[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const park of parks) {
      await upsertPark(db, park);
    }
  });
}

export async function getParkById(db: SQLite.SQLiteDatabase, id: string): Promise<Park | null> {
  const row = await db.getFirstAsync<any>('SELECT * FROM parks WHERE id = ?', [id]);
  return row ? rowToPark(row) : null;
}

export async function searchParks(
  db: SQLite.SQLiteDatabase,
  query: string,
  source: 'all' | 'nps' | 'state',
  stateFilter: string | null,
  limit = 50,
  offset = 0,
  designationFilter: string | null = null
): Promise<Park[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (query.trim()) {
    conditions.push('full_name LIKE ?');
    params.push(`%${query.trim()}%`);
  }
  if (source !== 'all') {
    conditions.push('source = ?');
    params.push(source);
  }
  if (stateFilter) {
    conditions.push('state_codes LIKE ?');
    params.push(`%${stateFilter}%`);
  }
  if (designationFilter) {
    conditions.push('designation = ?');
    params.push(designationFilter);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);

  const rows = await db.getAllAsync<any>(
    `SELECT * FROM parks ${where} ORDER BY full_name ASC LIMIT ? OFFSET ?`,
    params
  );
  return rows.map(rowToPark);
}

export async function getVisitedParks(db: SQLite.SQLiteDatabase): Promise<Park[]> {
  const rows = await db.getAllAsync<any>(
    `SELECT p.* FROM parks p
     INNER JOIN visits v ON v.park_id = p.id
     ORDER BY v.visited_at DESC`
  );
  return rows.map(rowToPark);
}

export async function getParkCount(db: SQLite.SQLiteDatabase, source?: 'nps' | 'state'): Promise<number> {
  const row = source
    ? await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM parks WHERE source = ?', [source])
    : await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM parks');
  return row?.count ?? 0;
}
