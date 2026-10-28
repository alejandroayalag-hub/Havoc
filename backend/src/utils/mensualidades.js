// Genera los cargos de mensualidad que falten hasta el mes actual. Idempotente (UNIQUE sistema_id+periodo),
// se llama al leer clientes/finanzas.
// ponytail: sin cron; basta con que alguien abra la plataforma para que aparezcan los cargos del mes
const pool = require('../db/pool');

async function generarMensualidades() {
  await pool.query(`
    INSERT INTO cobros (cliente_id, sistema_id, tipo, concepto, periodo, monto, vence)
    SELECT s.cliente_id, s.id, 'mensualidad', s.nombre || ' · ' || to_char(m, 'MM/YYYY'), m::date, s.mensualidad,
           (m + (c.dia_corte - 1) * INTERVAL '1 day')::date
    FROM sistemas s
    JOIN clientes c ON c.id = s.cliente_id
    CROSS JOIN LATERAL generate_series(date_trunc('month', s.cobrar_desde), date_trunc('month', CURRENT_DATE), INTERVAL '1 month') m
    WHERE s.activo AND c.activo AND s.mensualidad > 0
    ON CONFLICT (sistema_id, periodo) DO NOTHING`);
}

module.exports = { generarMensualidades };
