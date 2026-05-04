import db from './database';

export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 0,
      config TEXT NOT NULL,
      latest_data TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Add latest_data column to existing tables that were created without it
  const cols = (db.prepare(`PRAGMA table_info(cards)`).all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes('latest_data')) {
    db.exec(`ALTER TABLE cards ADD COLUMN latest_data TEXT;`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id TEXT NOT NULL,
      value REAL NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS event_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      level TEXT NOT NULL,
      event TEXT NOT NULL,
      card_id TEXT,
      card_type TEXT,
      meta TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_price_history_card_id ON price_history(card_id);
    CREATE INDEX IF NOT EXISTS idx_event_log_card_id ON event_log(card_id);
    CREATE INDEX IF NOT EXISTS idx_event_log_timestamp ON event_log(timestamp);
  `);
}
