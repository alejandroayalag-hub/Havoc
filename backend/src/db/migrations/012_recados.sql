-- Recados tipo post-it (esquina inferior izquierda). para_id NULL = para todos.
-- Se quedan hasta que el autor o el destinatario los marca como hechos.
CREATE TABLE recados (
  id         SERIAL PRIMARY KEY,
  texto      VARCHAR(500) NOT NULL,
  color      VARCHAR(10) NOT NULL DEFAULT 'amarillo' CHECK (color IN ('amarillo', 'rosa', 'verde', 'azul')),
  autor_id   INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  para_id    INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  hecho_at   TIMESTAMPTZ,
  hecho_por  INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX recados_pendientes ON recados (created_at) WHERE hecho_at IS NULL;
