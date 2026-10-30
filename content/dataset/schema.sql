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
