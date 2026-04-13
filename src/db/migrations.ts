export const migrations = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS parks (
        id          TEXT PRIMARY KEY,
        source      TEXT NOT NULL,
        full_name   TEXT NOT NULL,
        description TEXT,
        state_codes TEXT,
        latitude    REAL,
        longitude   REAL,
        designation TEXT,
        image_url   TEXT,
        raw_json    TEXT,
        last_synced INTEGER
      );

      CREATE TABLE IF NOT EXISTS visits (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        park_id     TEXT NOT NULL REFERENCES parks(id),
        visited_at  INTEGER NOT NULL,
        notes       TEXT,
        rating      INTEGER
      );

      CREATE TABLE IF NOT EXISTS photos (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        park_id     TEXT NOT NULL REFERENCES parks(id),
        uri         TEXT NOT NULL,
        taken_at    INTEGER NOT NULL,
        caption     TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_parks_source    ON parks(source);
      CREATE INDEX IF NOT EXISTS idx_parks_states    ON parks(state_codes);
      CREATE INDEX IF NOT EXISTS idx_visits_park_id  ON visits(park_id);
      CREATE INDEX IF NOT EXISTS idx_photos_park_id  ON photos(park_id);

      CREATE TABLE IF NOT EXISTS kv_store (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `,
  },
];
