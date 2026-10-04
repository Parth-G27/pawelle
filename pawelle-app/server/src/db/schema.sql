CREATE TABLE IF NOT EXISTS pets (
  id                  INTEGER PRIMARY KEY,
  name                TEXT    NOT NULL,
  species             TEXT    NOT NULL DEFAULT 'cat',
  sex                 TEXT,
  neutered            TEXT,
  birthdate           TEXT,
  birthdate_estimated INTEGER NOT NULL DEFAULT 0,
  breed               TEXT,
  weight_kg           REAL,
  activity_level      TEXT    NOT NULL DEFAULT 'balanced',
  diet_type           TEXT,
  allergies           TEXT,
  conditions          TEXT,
  notes               TEXT,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pet_photos (
  id         INTEGER PRIMARY KEY,
  pet_id     INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  slot       INTEGER NOT NULL CHECK (slot IN (1, 2)),
  mime       TEXT    NOT NULL,
  data       BLOB    NOT NULL,
  updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (pet_id, slot)
);

CREATE TABLE IF NOT EXISTS checkins (
  id           INTEGER PRIMARY KEY,
  pet_id       INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  date         TEXT    NOT NULL,
  mood         TEXT,
  appetite     TEXT,
  energy       TEXT,
  play_minutes INTEGER,
  litter       TEXT,
  note         TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (pet_id, date)
);
CREATE INDEX IF NOT EXISTS idx_checkins_pet_date ON checkins (pet_id, date DESC);
