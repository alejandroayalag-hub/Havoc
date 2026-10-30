-- Demos nuevas en havoc-demo (módulos taller, expedientes y rondines de la plataforma) y landing publicada.
-- Solo llena módulos sin demo, para no pisar una URL capturada a mano desde el catálogo.

UPDATE modulos SET demo_url = d.url, miniatura = d.img, updated_at = NOW()
FROM (VALUES
  ('Bitácora automotriz', 'http://62.238.3.136:8103/taller',            '/demos/bitacora-automotriz.png'),
  ('Expediente MX',       'http://62.238.3.136:8103/expedientes',       '/demos/expedientes.png'),
  ('Rondines',            'http://62.238.3.136:8103/rondines',          '/demos/rondines.png'),
  ('Seguridad privada',   'http://62.238.3.136:8103/rondines/puntos',   '/demos/seguridad.png'),
  ('Checador biométrico', 'http://62.238.3.136:8103/personal/checador', '/demos/checador.png'),
  ('Landing / sitio web', 'https://serviciosata.com',                   '/demos/landing.webp')
) AS d(nombre, url, img)
WHERE modulos.nombre = d.nombre AND modulos.demo_url IS NULL;
