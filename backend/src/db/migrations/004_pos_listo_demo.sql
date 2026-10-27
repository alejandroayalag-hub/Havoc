-- Punto de venta ya empaquetado como módulo de la Plataforma HAVOC, con demo en vivo

UPDATE modulos SET
  estado = 'listo',
  proyecto_origen = 'Plataforma HAVOC · módulo pos',
  descripcion = 'Venta de mostrador con código de barras, a granel o por pieza, corte de caja e inventario.',
  para_quien = 'Abarrotes, tiendas, papelerías, ferreterías, farmacias',
  funciones = 'Venta con lector de código de barras, pieza o granel (kg/lt/m), ticket 80 mm, abrir/cerrar caja con corte, cancelaciones, inventario con entradas y ajustes, proveedores, reportes de ganancia y más vendidos',
  updated_at = NOW()
WHERE nombre = 'Punto de venta';

UPDATE modulos SET proyecto_origen = 'Plataforma HAVOC · módulo personal', updated_at = NOW()
WHERE nombre = 'Recursos Humanos';

INSERT INTO materiales (titulo, tipo, url, modulo_id, notas)
SELECT 'Demo en vivo — Punto de venta', 'otro', 'http://62.238.3.136:8103', id,
       'Tienda de ejemplo Abarrotes La Esperanza. Crea al lead un usuario solo con los módulos que le interesan.'
FROM modulos WHERE nombre = 'Punto de venta'
  AND NOT EXISTS (SELECT 1 FROM materiales WHERE titulo = 'Demo en vivo — Punto de venta');

INSERT INTO materiales (titulo, tipo, url, modulo_id, notas)
SELECT 'Demo en vivo — Personal', 'otro', 'http://62.238.3.136:8103/personal', id,
       'Expedientes, documentos y contratos en la tienda de ejemplo.'
FROM modulos WHERE nombre = 'Recursos Humanos'
  AND NOT EXISTS (SELECT 1 FROM materiales WHERE titulo = 'Demo en vivo — Personal');
