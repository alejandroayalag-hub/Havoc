-- Ideas de módulos nuevos: necesidades que se escuchan a leads y clientes.
-- Cada vez que alguien la pide es una solicitud; "cuántos la han pedido" = COUNT de solicitudes.

CREATE TABLE ideas (
  id          SERIAL PRIMARY KEY,
  titulo      VARCHAR(150) NOT NULL UNIQUE,
  descripcion TEXT,
  existe_en   VARCHAR(150),  -- proyecto donde ya existe aunque no esté empaquetado (ej. "Gioval")
  estado      VARCHAR(20) NOT NULL DEFAULT 'nueva'
              CHECK (estado IN ('nueva', 'evaluacion', 'empaquetar', 'catalogo', 'descartada')),
  modulo_id   INTEGER REFERENCES modulos(id) ON DELETE SET NULL,  -- al pasar al catálogo
  created_by  INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE idea_solicitudes (
  id         SERIAL PRIMARY KEY,
  idea_id    INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  lead_id    INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  nota       TEXT,  -- lo que dijo, en sus palabras
  created_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idea_solicitudes_idea_idx ON idea_solicitudes (idea_id);
CREATE INDEX idea_solicitudes_lead_idx ON idea_solicitudes (lead_id);
