CREATE TABLE bands (
  id             INTEGER PRIMARY KEY,
  name           TEXT NOT NULL,
  country        TEXT NOT NULL,
  genre          TEXT NOT NULL,
  formed_year    INTEGER NOT NULL,
  disbanded_year INTEGER            -- NULL = banda em atividade
);

CREATE TABLE venues (
  id       INTEGER PRIMARY KEY,
  name     TEXT NOT NULL,
  city     TEXT NOT NULL,
  capacity INTEGER NOT NULL
);

CREATE TABLE shows (
  id           INTEGER PRIMARY KEY,
  band_id      INTEGER NOT NULL REFERENCES bands(id),
  venue_id     INTEGER NOT NULL REFERENCES venues(id),
  show_date    TEXT NOT NULL,       -- formato AAAA-MM-DD
  ticket_price REAL NOT NULL
);

CREATE TABLE tickets (
  id       INTEGER PRIMARY KEY,
  show_id  INTEGER NOT NULL REFERENCES shows(id),
  buyer    TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  status   TEXT NOT NULL            -- 'pago', 'reservado' ou 'cancelado'
);

CREATE TABLE members (
  id        INTEGER PRIMARY KEY,
  name      TEXT NOT NULL,
  band_id   INTEGER NOT NULL REFERENCES bands(id),
  mentor_id INTEGER REFERENCES members(id)  -- NULL = sem mentor
);

CREATE TABLE merch (
  id      INTEGER PRIMARY KEY,
  band_id INTEGER REFERENCES bands(id),  -- NULL = produto do próprio festival
  item    TEXT NOT NULL,
  price   REAL NOT NULL,
  stock   INTEGER NOT NULL
);

CREATE TABLE press_contacts (
  id        INTEGER PRIMARY KEY,
  full_name TEXT NOT NULL,
  email     TEXT NOT NULL,
  outlet    TEXT,                 -- veículo. Pode ser NULL ou vazio
  phone     TEXT
);

CREATE TABLE checkins (
  id         INTEGER PRIMARY KEY,
  ticket_id  INTEGER NOT NULL REFERENCES tickets(id),
  gate       TEXT NOT NULL,
  scanned_at TEXT NOT NULL        -- formato AAAA-MM-DD HH:MM:SS
);
