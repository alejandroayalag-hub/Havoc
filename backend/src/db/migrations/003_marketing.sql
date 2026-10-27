-- Material de marketing: archivos subidos o ligas (YouTube/Drive), opcionalmente ligados a un módulo

CREATE TABLE materiales (
  id         SERIAL PRIMARY KEY,
  titulo     VARCHAR(150) NOT NULL,
  tipo       VARCHAR(20) NOT NULL DEFAULT 'otro'
             CHECK (tipo IN ('logo', 'presentacion', 'video', 'documento', 'imagen', 'otro')),
  archivo    VARCHAR(300),
  url        TEXT,
  modulo_id  INTEGER REFERENCES modulos(id) ON DELETE SET NULL,
  notas      TEXT,
  created_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (archivo IS NOT NULL OR url IS NOT NULL)
);
CREATE INDEX materiales_modulo_idx ON materiales (modulo_id);

-- Logos oficiales: viven en frontend/public/marca (no en uploads)
INSERT INTO materiales (titulo, tipo, url, notas) VALUES
('Logo HAVOC — ícono', 'logo', '/marca/logo-icon.svg', 'Primario, fondo ciruela. Es el favicon.'),
('Logo HAVOC — monocromo', 'logo', '/marca/logo-mono.svg', 'Fondo violeta sólido, ícono blanco.'),
('Logo HAVOC — invertido', 'logo', '/marca/logo-invertido.svg', 'Fondo blanco, ícono ciruela.'),
('Logo HAVOC — con nombre', 'logo', '/marca/logo-wordmark.svg', 'Ícono + HAVOC / SOLUCIONES INTEGRADAS. Firma de correo y documentos.');
