-- Precio base del catálogo y demo en vivo por módulo (miniatura = captura en frontend/public/demos)

ALTER TABLE modulos ADD COLUMN demo_url TEXT, ADD COLUMN miniatura VARCHAR(200);

-- Precio de entrada: $20,000 (diseño, adecuación e implementación) + $1,500/mes
UPDATE modulos SET precio_desarrollo = 20000, mensualidad = 1500, updated_at = NOW();

UPDATE modulos SET demo_url = 'http://62.238.3.136:8103/pos', miniatura = '/demos/pos.png' WHERE nombre = 'Punto de venta';
UPDATE modulos SET demo_url = 'http://62.238.3.136:8103/personal', miniatura = '/demos/personal.png' WHERE nombre = 'Recursos Humanos';
