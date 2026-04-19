import * as SQLite from 'expo-sqlite';
import { migrations } from './migrations';
import { seedStateParks } from '../services/seedStateParks';

export async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Simple manual migration runner using kv_store version tracking
  // Run migrations table bootstrap first
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY
    );
  `);

  for (const migration of migrations) {
    const existing = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM _migrations WHERE version = ?',
      [migration.version]
    );
    if (!existing) {
      await db.execAsync(migration.sql);
      await db.runAsync('INSERT INTO _migrations (version) VALUES (?)', [migration.version]);
    }
  }

  // Seed state parks data
  await seedStateParks(db);
}

// KV store helpers
export async function kvGet(db: SQLite.SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM kv_store WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function kvSet(db: SQLite.SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO kv_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}
