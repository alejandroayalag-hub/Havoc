-- Demo de HVAC (sistema de Pedraza AC, con permiso del cliente): "Ver funcionando" abre su landing pública;
-- la miniatura es el panel admin. No se liga el panel real porque trae datos del cliente.
UPDATE modulos SET demo_url = 'http://167.233.29.72:8090', miniatura = '/demos/hvac-panel.webp', updated_at = NOW()
WHERE nombre = 'Servicio en campo HVAC' AND demo_url IS NULL;

INSERT INTO materiales (titulo, tipo, url, modulo_id, notas)
SELECT d.titulo, 'imagen', d.url, m.id, d.notas
FROM modulos m, (VALUES
  ('HVAC — panel administrativo', '/demos/hvac-panel.webp', 'Dashboard del panel de Pedraza AC: órdenes, clientes, visitas, inventario de vans, mapa en vivo, catálogo de precios, membresías, bitácora biométrica, cotizaciones y facturas.'),
  ('HVAC — landing del cliente',  '/demos/hvac-landing.webp', 'Landing pública de Pedraza AC (Houston, TX) conectada a su sistema: los leads llegan al panel. http://167.233.29.72:8090')
) AS d(titulo, url, notas)
WHERE m.nombre = 'Servicio en campo HVAC'
  AND NOT EXISTS (SELECT 1 FROM materiales x WHERE x.url = d.url);
