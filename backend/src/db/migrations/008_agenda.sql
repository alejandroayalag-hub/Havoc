-- Agenda: reuniones, entregas y capacitaciones ligadas a un lead o cliente.
-- Los cobros no se guardan aquí: se leen de cobros pendientes. Se espejean al calendario CalDAV de ventas@.

CREATE TABLE eventos (
  id         SERIAL PRIMARY KEY,
  tipo       VARCHAR(20) NOT NULL CHECK (tipo IN ('reunion', 'entrega', 'capacitacion')),
  titulo     VARCHAR(200) NOT NULL,
  inicio     TIMESTAMPTZ NOT NULL,
  fin        TIMESTAMPTZ NOT NULL CHECK (fin > inicio),
  lead_id    INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  notas      TEXT,
  caldav_url TEXT,   -- NULL = aún no está en el calendario de ventas@ (la Agenda manda; sin etag)
  creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX eventos_inicio_idx ON eventos (inicio);
