import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Photo } from '../types';

function rowToPhoto(row: any): Photo {
  return {
    id: row.id,
    parkId: row.park_id,
    uri: row.uri,
    takenAt: row.taken_at,
    caption: row.caption,
  };
}

export async function getPhotosForPark(db: SQLite.SQLiteDatabase, parkId: string): Promise<Photo[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM photos WHERE park_id = ? ORDER BY taken_at DESC',
    [parkId]
  );
  return rows.map(rowToPhoto);
}

export async function addPhoto(
  db: SQLite.SQLiteDatabase,
  parkId: string,
  uri: string,
  caption?: string
): Promise<Photo> {
  const now = Date.now();
  const result = await db.runAsync(
    'INSERT INTO photos (park_id, uri, taken_at, caption) VALUES (?, ?, ?, ?)',
    [parkId, uri, now, caption ?? null]
  );
  return { id: result.lastInsertRowId, parkId, uri, takenAt: now, caption: caption ?? null };
}

export async function deletePhoto(db: SQLite.SQLiteDatabase, photoId: number): Promise<void> {
  const row = await db.getFirstAsync<{ uri: string }>('SELECT uri FROM photos WHERE id = ?', [photoId]);
  if (row?.uri) {
    try {
      await FileSystem.deleteAsync(row.uri, { idempotent: true });
    } catch {
      // File already gone — proceed with DB deletion
    }
  }
  await db.runAsync('DELETE FROM photos WHERE id = ?', [photoId]);
}

export async function getPhotoCount(db: SQLite.SQLiteDatabase, parkId: string): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM photos WHERE park_id = ?',
    [parkId]
  );
  return row?.count ?? 0;
}
