-- Despacho jurídico (sistema Lexium) al catálogo. Capturas de prod usando solo el caso DEMO-123/2026.
-- Sin demo_url: no hay demo pública (el sistema real tiene datos del despacho).
INSERT INTO modulos (nombre, descripcion, para_quien, funciones, estado, proyecto_origen, precio_desarrollo, mensualidad, miniatura)
VALUES ('Despacho jurídico',
        'Gestión de despacho: expedientes, clientes y calendario, con asistente de IA para contestar demandas.',
        'Despachos de abogados y notarías',
        'Expedientes por etapa con actuaciones, documentos y eventos; clientes; calendario de audiencias y vencimientos; asistente de contestación que anonimiza los datos antes de la IA y propone respuestas apoyadas en tesis; roles abogado/colaborador',
        'listo', 'Lexium', 20000, 1500, '/demos/lexium-escritorio.webp')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO materiales (titulo, tipo, url, modulo_id, notas)
SELECT d.titulo, 'imagen', d.url, m.id, d.notas
FROM modulos m, (VALUES
  ('Lexium — escritorio', '/demos/lexium-escritorio.webp', 'Escritorio del despacho: buscador "¿En qué trabajamos hoy?", expedientes activos, próximos 7 días y módulos.'),
  ('Lexium — anonimización', '/demos/lexium-anonimizacion.webp', 'Vista previa de lo que se manda a la IA: nombres, CURP y teléfonos reemplazados por marcadores. Caso de demostración.'),
  ('Lexium — propuesta de contestación', '/demos/lexium-propuesta.webp', 'Propuesta de contestación por hecho, con pendientes a completar y tesis sugerida con su registro. Caso de demostración.')
) AS d(titulo, url, notas)
WHERE m.nombre = 'Despacho jurídico'
  AND NOT EXISTS (SELECT 1 FROM materiales x WHERE x.url = d.url);
