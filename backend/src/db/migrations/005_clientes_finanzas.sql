-- Fase 2: clientes con sus sistemas instalados, cobros (desarrollo y mensualidades) y gastos

CREATE TABLE clientes (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(150) NOT NULL UNIQUE,
  contacto     VARCHAR(150),
  telefono     VARCHAR(30),
  email        VARCHAR(150),
  razon_social VARCHAR(200),
  rfc          VARCHAR(13),
  dia_corte    SMALLINT NOT NULL DEFAULT 1 CHECK (dia_corte BETWEEN 1 AND 28),
  lead_id      INTEGER UNIQUE REFERENCES leads(id) ON DELETE SET NULL,
  notas        TEXT,
  activo       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sin contraseñas: solo dónde vive cada sistema (anti-objetivo del spec)
CREATE TABLE sistemas (
  id               SERIAL PRIMARY KEY,
  cliente_id       INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  modulo_id        INTEGER REFERENCES modulos(id) ON DELETE SET NULL,
  nombre           VARCHAR(150) NOT NULL,
  url              VARCHAR(300),
  servidor         VARCHAR(150),
  repo             VARCHAR(300),
  fecha_entrega    DATE,
  manual_entregado BOOLEAN NOT NULL DEFAULT false,
  capacitacion     BOOLEAN NOT NULL DEFAULT false,
  mensualidad      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (mensualidad >= 0),
  -- primer mes que se genera la mensualidad; los clientes ya existentes no arrastran meses viejos
  cobrar_desde     DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE),
  activo           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX sistemas_cliente_idx ON sistemas (cliente_id);

CREATE TABLE cobros (
  id         SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  sistema_id INTEGER REFERENCES sistemas(id) ON DELETE SET NULL,
  tipo       VARCHAR(20) NOT NULL CHECK (tipo IN ('desarrollo', 'mensualidad', 'otro')),
  concepto   VARCHAR(200) NOT NULL,
  periodo    DATE,  -- mes de la mensualidad (día 1); NULL en desarrollo/otro
  monto      NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  vence      DATE NOT NULL,
  pagado_el  DATE,
  notas      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sistema_id, periodo)
);
CREATE INDEX cobros_cliente_idx ON cobros (cliente_id);
CREATE INDEX cobros_pendientes_idx ON cobros (vence) WHERE pagado_el IS NULL;

CREATE TABLE gastos (
  id         SERIAL PRIMARY KEY,
  fecha      DATE NOT NULL DEFAULT CURRENT_DATE,
  concepto   VARCHAR(200) NOT NULL,
  categoria  VARCHAR(20) NOT NULL DEFAULT 'otro'
             CHECK (categoria IN ('servidor', 'dominio', 'licencia', 'cuenta_dev', 'otro')),
  monto      NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  notas      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX gastos_fecha_idx ON gastos (fecha);

-- Carga inicial: clientes actuales con dónde vive su sistema; montos en blanco, los captura el usuario
INSERT INTO clientes (nombre) VALUES
  ('Grupo ATA'), ('Gioval'), ('Pedraza AC'), ('KERAGROmel'), ('Diandra'), ('GESSI'),
  ('Gokids'), ('Colegio Educare'), ('Mi Huerta'), ('AutoFix Querétaro'), ('Lexium');

INSERT INTO sistemas (cliente_id, modulo_id, nombre, url, servidor)
SELECT c.id, m.id, s.nombre, s.url, s.servidor
FROM (VALUES
  ('Grupo ATA',         'Recursos Humanos',       'RH ATA',                   NULL,                         '62.238.3.136'),
  ('Grupo ATA',         'Rondines',               'Rondines',                 NULL,                         '62.238.3.136'),
  ('Grupo ATA',         'Landing / sitio web',    'Landing serviciosata.com', 'https://serviciosata.com',   '62.238.3.136'),
  ('Gioval',            'Clínica',                'Plataforma Gioval',        'https://app.gioval.mx',      '62.238.3.136'),
  ('Gioval',            'Landing / sitio web',    'Landing gioval.mx',        'https://gioval.mx',          '62.238.3.136'),
  ('Pedraza AC',        'Servicio en campo HVAC', 'Plataforma Pedraza',       NULL,                         '167.233.29.72'),
  ('Pedraza AC',        'Landing / sitio web',    'Landing Pedraza',          'http://167.233.29.72:8090',  '167.233.29.72'),
  ('KERAGROmel',        'Recursos Humanos',       'RH KERAGROmel',            'http://62.238.3.136:8096',   '62.238.3.136'),
  ('Diandra',           'Recursos Humanos',       'DIANDRA despacho contable','http://62.238.3.136:8098',   '62.238.3.136'),
  ('GESSI',             'Seguridad privada',      'Plataforma GESSI',         'http://62.238.3.136:8101',   '62.238.3.136'),
  ('Gokids',            'Control escolar',        'Gokids',                   NULL,                         NULL),
  ('Colegio Educare',   'Control escolar',        'Educare',                  NULL,                         NULL),
  ('Mi Huerta',         'Agrícola',               'Mi Huerta',                NULL,                         NULL),
  ('AutoFix Querétaro', 'Bitácora automotriz',    'AutoFix',                  'http://62.238.3.136:8082',   '62.238.3.136'),
  ('Lexium',            NULL,                     'Lexium gestión de casos',  'https://lexium.havocdev.mx', '62.238.3.136')
) AS s (cliente, modulo, nombre, url, servidor)
JOIN clientes c ON c.nombre = s.cliente
LEFT JOIN modulos m ON m.nombre = s.modulo;
