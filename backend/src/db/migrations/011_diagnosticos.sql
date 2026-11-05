-- Diagnóstico de un lead: cuestionario que Lili llena en la llamada; el extracto le llega a Alejandro.
-- Las preguntas viven en el frontend (lib/diagnostico.js); aquí solo se guardan las respuestas.

CREATE TABLE diagnosticos (
  lead_id    INTEGER PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
  respuestas JSONB NOT NULL DEFAULT '{}',
  estado     VARCHAR(20) NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviado')),
  enviado_at TIMESTAMPTZ,
  updated_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
