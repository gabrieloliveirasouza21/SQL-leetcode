-- Casos de borda usados só na submissão: empates, limites de data e preço,
-- IDs diferentes do exemplo (pega valores fixos na query) e hierarquia mais funda.
INSERT INTO bands VALUES
  (10, 'Ruína',       'Brasil',      'Thrash Metal', 2003, NULL),
  (11, 'Abismo',      'Brasil',      'Black Metal',  2003, NULL),
  (12, 'Zênite',      'Brasil',      'Doom Metal',   1999, 2010),
  (13, 'Old Forge',   'Reino Unido', 'Heavy Metal',  1980, NULL),
  (14, 'Ghostmarch',  'Suécia',      'Heavy Metal',  1999, NULL),
  (15, 'Silent Reef', 'Japão',       'Post Metal',   2000, NULL),
  (16, 'Mar Morto',   'Brasil',      'Post Metal',   2021, NULL);

INSERT INTO venues VALUES
  (20, 'Arena Tupi', 'São Paulo', 9000),
  (21, 'Porão',      'Recife',     500),
  (22, 'Cúpula',     'Manaus',    2500);

INSERT INTO shows VALUES
  (30, 10, 20, '2026-01-10', 100),
  (31, 10, 21, '2026-02-10', 100),
  (32, 10, 22, '2026-03-10',  40),
  (33, 11, 21, '2026-01-10',  60),
  (34, 13, 20, '2026-12-31', 400),
  (35, 13, 22, '2026-01-01', 400),
  (36, 13, 21, '2025-12-31', 150),
  (37, 16, 21, '2027-02-01',  30),
  (38, 14, 22, '2026-06-06',  55),
  (39, 14, 21, '2026-06-06',  55),
  (40, 14, 20, '2026-06-06', 200);

INSERT INTO tickets VALUES
  (50, 30, 'Alê',   2, 'pago'),
  (51, 30, 'Bela',  3, 'cancelado'),
  (52, 31, 'Cris',  1, 'pago'),
  (53, 31, 'Dani',  9, 'pago'),
  (54, 32, 'Enzo',  2, 'reservado'),
  (55, 34, 'Flor',  4, 'pago'),
  (56, 35, 'Guto',  2, 'pago'),
  (57, 38, 'Hana',  1, 'cancelado'),
  (58, 40, 'Ivo',   5, 'pago'),
  (59, 33, 'Jade',  1, 'pago');

INSERT INTO members VALUES
  (100, 'Zeca Mota',   10, NULL),
  (101, 'Ana Ferro',   10, 100),
  (102, 'Bruna Sá',    11, 101),
  (103, 'Cid Araújo',  16, 102),
  (104, 'Dora Lins',   16, 103),
  (105, 'Enzo Rocha',  13, 104),
  (106, 'Fábio Melo',  13, 100),
  (107, 'Gil Pontes',  14, 101);
