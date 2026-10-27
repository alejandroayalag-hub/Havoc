-- Catálogo de módulos, leads de venta y cotizaciones (Fase 1)

CREATE TABLE modulos (
  id                SERIAL PRIMARY KEY,
  nombre            VARCHAR(120) NOT NULL UNIQUE,
  descripcion       TEXT,
  para_quien        TEXT,
  funciones         TEXT,
  precio_desarrollo NUMERIC(12,2),
  mensualidad       NUMERIC(12,2),
  estado            VARCHAR(20) NOT NULL DEFAULT 'listo'
                    CHECK (estado IN ('listo', 'sin_empaquetar')),
  proyecto_origen   VARCHAR(120),
  activo            BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE leads (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(150) NOT NULL,
  telefono        VARCHAR(30),
  empresa         VARCHAR(150),
  recomendado_por VARCHAR(150),
  necesidad       TEXT,
  etapa           VARCHAR(20) NOT NULL DEFAULT 'nuevo'
                  CHECK (etapa IN ('nuevo', 'reunion', 'cotizacion', 'ganado', 'perdido')),
  motivo_perdida  TEXT,
  notas           TEXT,
  created_by      INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX leads_etapa_idx ON leads (etapa);

CREATE TABLE cotizaciones (
  id         SERIAL PRIMARY KEY,
  lead_id    INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  notas      TEXT,
  created_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX cotizaciones_lead_idx ON cotizaciones (lead_id);

CREATE TABLE cotizacion_items (
  id                SERIAL PRIMARY KEY,
  cotizacion_id     INTEGER NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  modulo_id         INTEGER REFERENCES modulos(id) ON DELETE SET NULL,
  concepto          VARCHAR(200) NOT NULL,
  precio_desarrollo NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (precio_desarrollo >= 0),
  mensualidad       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (mensualidad >= 0)
);

-- Carga inicial: precios en blanco, los captura el usuario
INSERT INTO modulos (nombre, descripcion, para_quien, funciones, estado, proyecto_origen) VALUES
('Recursos Humanos', 'Expediente digital del personal con documentos, contratos y pagos.', 'Empresas con personal en nómina', 'Expediente por empleado, documentos con vencimiento, generador de contratos, pagos semanales, checador', 'listo', 'RHATA'),
('Checador biométrico', 'Reloj checador con huella/rostro conectado a la plataforma.', 'Empresas que controlan asistencia', 'Registro de entradas y salidas, mapeo de empleados a dispositivos, reporte de asistencia', 'listo', 'BioChek'),
('Rondines', 'Control de rondines de vigilancia con QR y GPS.', 'Empresas de seguridad privada', 'Puntos de control QR, ubicación GPS, bitácora de recorridos, reportes', 'listo', 'Rondines Grupo ATA'),
('Expediente MX', 'Expediente digital de documentos.', 'Despachos y oficinas', 'Alta de expedientes, carga de documentos, búsqueda', 'listo', 'Expediente MX'),
('Seguridad privada', 'Operación de empresa de seguridad: personal, rondines, finanzas y app checador.', 'Empresas de seguridad privada', 'Personal, rondines, finanzas, pizarrón, app móvil de checador', 'listo', 'GESSI'),
('Clínica', 'Gestión de clínica: citas, pacientes, historia clínica, consentimientos y finanzas.', 'Clínicas y consultorios', 'Agenda con Google Calendar, expediente clínico NOM-004, consentimientos firmados, caja, inventario de insumos', 'listo', 'Gioval'),
('Punto de venta', 'Venta de mostrador con inventario y corte de caja.', 'Comercios, farmacias', 'Venta por código de barras, inventario, corte de caja, reportes', 'sin_empaquetar', 'Gioval (Farmacia)'),
('Control escolar', 'Gestión escolar con cobranza y avisos a padres.', 'Escuelas y guarderías', 'Alumnos, colegiaturas con MercadoPago, RH, finanzas, notificaciones a padres', 'listo', 'Gokids / Educare'),
('Agrícola', 'Administración de huertas.', 'Productores agrícolas', 'RH de jornaleros, huertas, finanzas, app móvil', 'listo', 'Mi Huerta'),
('Servicio en campo HVAC', 'Operación de técnicos en campo con evaluaciones y fotos.', 'Empresas de servicio técnico', 'Órdenes, evaluaciones con fotos, cotización con firma del cliente, check-in/out de técnicos', 'listo', 'Pedraza AC'),
('Bitácora automotriz', 'Historial de servicios por vehículo.', 'Talleres mecánicos', 'Vehículos, servicios realizados, historial por cliente', 'listo', 'AutoFix'),
('Landing / sitio web', 'Sitio web de una página con dominio y HTTPS.', 'Cualquier negocio', 'Diseño a la marca, dominio, certificado HTTPS, formulario de contacto o WhatsApp', 'listo', 'HAVOC');
