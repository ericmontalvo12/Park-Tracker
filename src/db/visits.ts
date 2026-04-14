import * as SQLite from 'expo-sqlite';
import { Visit } from '../types';

function rowToVisit(row: any): Visit {
  return {
    id: row.id,
    parkId: row.park_id,
    visitedAt: row.visited_at,
    notes: row.notes,
    rating: row.rating,
  };
}

export async function getVisit(db: SQLite.SQLiteDatabase, parkId: string): Promise<Visit | null> {
  const row = await db.getFirstAsync<any>('SELECT * FROM visits WHERE park_id = ? LIMIT 1', [parkId]);
  return row ? rowToVisit(row) : null;
}

export async function addVisit(db: SQLite.SQLiteDatabase, parkId: string): Promise<Visit> {
  const now = Date.now();
  const result = await db.runAsync(
    'INSERT INTO visits (park_id, visited_at) VALUES (?, ?)',
    [parkId, now]
  );
  return { id: result.lastInsertRowId, parkId, visitedAt: now, notes: null, rating: null };
}

export async function removeVisit(db: SQLite.SQLiteDatabase, parkId: string): Promise<void> {
  await db.runAsync('DELETE FROM visits WHERE park_id = ?', [parkId]);
}

export async function updateVisitNotes(
  db: SQLite.SQLiteDatabase,
  parkId: string,
  notes: string
): Promise<void> {
  await db.runAsync('UPDATE visits SET notes = ? WHERE park_id = ?', [notes, parkId]);
}

export async function updateVisitRating(
  db: SQLite.SQLiteDatabase,
  parkId: string,
  rating: number
): Promise<void> {
  await db.runAsync('UPDATE visits SET rating = ? WHERE park_id = ?', [rating, parkId]);
}

export async function updateVisitDate(
  db: SQLite.SQLiteDatabase,
  parkId: string,
  visitedAt: number
): Promise<void> {
  await db.runAsync('UPDATE visits SET visited_at = ? WHERE park_id = ?', [visitedAt, parkId]);
}

export async function getAllVisits(db: SQLite.SQLiteDatabase): Promise<Visit[]> {
  const rows = await db.getAllAsync<any>('SELECT * FROM visits ORDER BY visited_at DESC');
  return rows.map(rowToVisit);
}

export async function getVisitedParkIds(db: SQLite.SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ park_id: string }>('SELECT park_id FROM visits');
  return rows.map(r => r.park_id);
}

export async function getVisitedCount(db: SQLite.SQLiteDatabase, source?: 'nps' | 'state'): Promise<number> {
  const row = source
    ? await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(DISTINCT v.park_id) as count FROM visits v
         INNER JOIN parks p ON p.id = v.park_id WHERE p.source = ?`,
        [source]
      )
    : await db.getFirstAsync<{ count: number }>('SELECT COUNT(DISTINCT park_id) as count FROM visits');
  return row?.count ?? 0;
}

export async function getVisitedStates(db: SQLite.SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ state_codes: string }>(
    `SELECT DISTINCT p.state_codes FROM parks p INNER JOIN visits v ON v.park_id = p.id`
  );
  const stateSet = new Set<string>();
  for (const row of rows) {
    if (row.state_codes) {
      row.state_codes.split(',').forEach(s => stateSet.add(s.trim()));
    }
  }
  return Array.from(stateSet).sort();
}
