-- Consultorio médico (Mi Consul, demo pública con datos de ejemplo) y Consultorio de nutrición (Nutrimiel, sin demo:
-- es el sistema real de la clienta; capturas de la copia local con datos inventados).
INSERT INTO modulos (nombre, descripcion, para_quien, funciones, estado, proyecto_origen, precio_desarrollo, mensualidad, demo_url, miniatura)
VALUES
 ('Consultorio médico',
  'Lo básico para un consultorio: pacientes con historia clínica (antecedentes), agenda y finanzas.',
  'Médicos generales y especialistas, consultorios de uno o varios doctores',
  'Ficha del paciente con antecedentes heredofamiliares, patológicos, medicamentos/alergias, no patológicos y gineco-obstétricos (imprimible); agenda semanal con estados y aviso de empalme; cobro desde la cita; ingresos, gastos y balance mensual por categoría; usuarios con permisos por módulo',
  'listo', 'Mi Consul', 20000, 1500, 'https://miconsul.havocdev.mx', '/demos/consul-agenda.webp'),
 ('Consultorio de nutrición',
  'Consultorio médico + seguimiento antropométrico y planes alimenticios con la imagen del nutriólogo.',
  'Nutriólogos y clínicas de nutrición',
  'Todo lo de Consultorio médico; mediciones por consulta (peso, % grasa, músculo, cintura…) con IMC y gráficas de evolución; recetario de platillos con foto; menús por tiempo de comida que se imprimen/mandan en PDF con su logo; duplicar plan para la siguiente consulta',
  'listo', 'Nutrimiel', 20000, 1500, NULL, '/demos/nutri-menu.webp')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO materiales (titulo, tipo, url, modulo_id, notas)
SELECT d.titulo, 'imagen', d.url, m.id, d.notas
FROM modulos m JOIN (VALUES
  ('Consultorio médico', 'Mi Consul — agenda', '/demos/consul-agenda.webp', 'Agenda semanal con estado de cada cita (datos de ejemplo).'),
  ('Consultorio médico', 'Mi Consul — historia clínica', '/demos/consul-historia.webp', 'Ficha del paciente con antecedentes; se imprime.'),
  ('Consultorio médico', 'Mi Consul — finanzas', '/demos/consul-finanzas.webp', 'Ingresos, gastos y balance del mes por categoría.'),
  ('Consultorio de nutrición', 'Nutrición — menú impreso', '/demos/nutri-menu.webp', 'Plan alimenticio con la imagen de la nutrióloga, listo para PDF/WhatsApp. Paciente inventado.'),
  ('Consultorio de nutrición', 'Nutrición — seguimiento', '/demos/nutri-seguimiento.webp', 'Gráficas de peso, % grasa, cintura e IMC por consulta.'),
  ('Consultorio de nutrición', 'Nutrición — recetario', '/demos/nutri-recetario.webp', 'Recetario de platillos con foto e ingredientes.')
) AS d(modulo, titulo, url, notas) ON m.nombre = d.modulo
WHERE NOT EXISTS (SELECT 1 FROM materiales x WHERE x.url = d.url);
