INSERT INTO bands VALUES
  (1, 'Ferro Velho',   'Brasil',      'Thrash Metal', 1994, NULL),
  (2, 'Noite Eterna',  'Brasil',      'Black Metal',  2003, NULL),
  (3, 'Sepulcro Azul', 'Portugal',    'Doom Metal',   1998, 2015),
  (4, 'Iron Tide',     'Reino Unido', 'Heavy Metal',  1985, NULL),
  (5, 'Cinzas do Sul', 'Brasil',      'Thrash Metal', 2003, NULL),
  (6, 'Frostgrave',    'Noruega',     'Black Metal',  1992, 2009),
  (7, 'Vale Profundo', 'Brasil',      'Doom Metal',   2019, NULL),
  (8, 'Steel Hymn',    'Alemanha',    'Power Metal',  1996, NULL);

INSERT INTO venues VALUES
  (1, 'Arena Tupi',    'São Paulo',      12000),
  (2, 'Galpão 77',     'Curitiba',        1500),
  (3, 'Teatro Aurora', 'Porto Alegre',    3000),
  (4, 'Casa Rocha',    'Belo Horizonte',   800);

INSERT INTO shows VALUES
  (1,  1, 1, '2026-03-14', 180),
  (2,  1, 2, '2026-05-02',  90),
  (3,  2, 2, '2026-03-21',  70),
  (4,  2, 4, '2026-06-13',  60),
  (5,  4, 1, '2026-03-14', 320),
  (6,  4, 3, '2026-03-16', 250),
  (7,  5, 4, '2026-04-10',  50),
  (8,  8, 1, '2026-08-22', 280),
  (9,  8, 3, '2026-08-24', 280),
  (10, 1, 3, '2025-11-08', 120),
  (11, 5, 2, '2026-07-03',  75),
  (12, 5, 3, '2026-07-03',  80);

INSERT INTO tickets VALUES
  (1,  1,  'Bia',  2, 'pago'),
  (2,  1,  'Caio', 4, 'pago'),
  (3,  1,  'Duda', 1, 'cancelado'),
  (4,  2,  'Edu',  3, 'pago'),
  (5,  2,  'Fabi', 2, 'reservado'),
  (6,  3,  'Gabi', 1, 'pago'),
  (7,  5,  'Hugo', 5, 'pago'),
  (8,  5,  'Iris', 2, 'pago'),
  (9,  5,  'João', 2, 'cancelado'),
  (10, 6,  'Kai',  3, 'pago'),
  (11, 7,  'Lia',  2, 'reservado'),
  (12, 8,  'Mel',  6, 'pago'),
  (13, 9,  'Nina', 4, 'pago'),
  (14, 10, 'Otto', 3, 'pago'),
  (15, 11, 'Pri',  2, 'pago');

INSERT INTO members VALUES
  (1, 'Ana Ferro',   1, NULL),
  (2, 'Beto Lima',   1, 1),
  (3, 'Clara Dias',  2, 1),
  (4, 'Davi Reis',   5, 2),
  (5, 'Elis Nunes',  7, 3),
  (6, 'Fred Stone',  4, NULL),
  (7, 'Greta Voss',  8, 6),
  (8, 'Hélio Prado', 5, 4);

INSERT INTO merch VALUES
  (1, 1,    'Camiseta Ferro',      79.9,  40),
  (2, 1,    'Boné Ferro',          49.5,   0),
  (3, 4,    'Vinil Tide',         149,    12),
  (4, 8,    'Camiseta Hymn',       89.25,  5),
  (5, NULL, 'Copo do festival',    25,   300),
  (6, NULL, 'Mochila do festival', 119.75, 0);

INSERT INTO press_contacts VALUES
  (1, 'Marina Luz',   'MARINA@ROCKPRESS.COM',      'Rock Press', '(11) 99999-0001'),
  (2, 'Teo Brandao',  'teo.brandao@metalzine.net', 'Metal Zine', '(41) 98888-0002'),
  (3, 'Sofia Campos', 'sofia@gmail.com',           '',           NULL),
  (4, 'Rui Alves',    'Rui.Alves@RockPress.com',   NULL,         '(31) 97777-0004'),
  (5, 'Lara Neves',   'lara@metalzine.net',        'Metal Zine', '(11) 96666-0005');

INSERT INTO checkins VALUES
  (1, 1,  'Norte', '2026-03-14 18:05:12'),
  (2, 2,  'Sul',   '2026-03-14 19:47:00'),
  (3, 7,  'Norte', '2026-03-14 19:02:33'),
  (4, 8,  'Norte', '2026-03-14 20:15:45'),
  (5, 10, 'Sul',   '2026-03-16 18:30:00'),
  (6, 12, 'Leste', '2026-08-22 17:59:59'),
  (7, 13, 'Leste', '2026-08-24 21:00:00'),
  (8, 14, 'Norte', '2025-11-08 20:10:10');
