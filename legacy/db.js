import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, '10xmom.sqlite'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS moms (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    phone      TEXT NOT NULL DEFAULT '',
    areas      TEXT NOT NULL DEFAULT '[]',
    bio        TEXT NOT NULL DEFAULT '',
    active     INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    code          TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    phone         TEXT NOT NULL,
    area          TEXT NOT NULL,
    address       TEXT NOT NULL,
    address_notes TEXT NOT NULL DEFAULT '',
    items         TEXT NOT NULL DEFAULT '[]',
    notes         TEXT NOT NULL DEFAULT '',
    mom_id        INTEGER REFERENCES moms(id),
    pickup_date   TEXT NOT NULL,
    pickup_slot   TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'booked',
    price_usd     REAL,
    payment_link  TEXT NOT NULL DEFAULT '',
    paid_at       TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS orders_by_slot ON orders (mom_id, pickup_date, pickup_slot);
  CREATE INDEX IF NOT EXISTS orders_by_status ON orders (status);

  CREATE TABLE IF NOT EXISTS order_events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status     TEXT NOT NULL,
    note       TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    phone      TEXT NOT NULL,
    area       TEXT NOT NULL,
    experience TEXT NOT NULL DEFAULT '',
    has_car    INTEGER NOT NULL DEFAULT 0,
    status     TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL
  );
`);

export function getSetting(key, fallback) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : fallback;
}

export function setSetting(key, value) {
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, JSON.stringify(value));
}

// Sample Moms so the booking flow works on a fresh install. Edit or deactivate them in Admin → Moms.
if (db.prepare('SELECT COUNT(*) AS n FROM moms').get().n === 0) {
  const insert = db.prepare('INSERT INTO moms (name, areas, bio) VALUES (?, ?, ?)');
  const samples = [
    ['Mom Rita', ['Achrafieh', 'Badaro', 'Sin El Fil', 'Dekwaneh'], 'Sample profile. Careful with whites and delicate fabrics.'],
    ['Mom Nada', ['Hamra', 'Ras Beirut', 'Verdun', 'Mar Mikhael'], 'Sample profile. Ironing perfectionist, shirts come back crisp.'],
    ['Mom Hiba', ['Jounieh', 'Kaslik', 'Zouk', 'Jbeil'], 'Sample profile. Great with bedding, curtains and big family loads.'],
    ['Mom Carla', ['Antelias', 'Dbayeh', 'Jal El Dib', 'Zalka', 'Jdeideh'], 'Sample profile. Kids clothes and stain care specialist.'],
  ];
  for (const [name, areas, bio] of samples) insert.run(name, JSON.stringify(areas), bio);
}
