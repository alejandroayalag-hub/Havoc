// Finanzas: cobros (quién debe), gastos y reporte de ganancia por mes y por cliente
const router = require('express').Router();
const pool = require('../db/pool');
const { generarMensualidades } = require('../utils/mensualidades');

const TIPOS = ['desarrollo', 'mensualidad', 'otro'];
const CATEGORIAS = ['servidor', 'dominio', 'licencia', 'cuenta_dev', 'otro'];
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const vacio = (v) => (v === '' ? null : v);

function validarCobro(b, nuevo) {
  if (nuevo && !b.cliente_id) return 'Cliente requerido';
  if ((nuevo || b.concepto !== undefined) && !b.concepto?.trim()) return 'Concepto requerido';
  if ((nuevo || b.monto !== undefined) && !(Number(b.monto) > 0)) return 'Monto inválido';
  if (b.tipo !== undefined && !TIPOS.includes(b.tipo)) return 'Tipo inválido';
  if ((nuevo || b.vence !== undefined) && !FECHA.test(b.vence || '')) return 'Fecha de vencimiento inválida';
  if (b.pagado_el && !FECHA.test(b.pagado_el)) return 'Fecha de pago inválida';
  return null;
}

function validarGasto(b, nuevo) {
  if ((nuevo || b.concepto !== undefined) && !b.concepto?.trim()) return 'Concepto requerido';
  if ((nuevo || b.monto !== undefined) && !(Number(b.monto) > 0)) return 'Monto inválido';
  if (b.categoria !== undefined && !CATEGORIAS.includes(b.categoria)) return 'Categoría inválida';
  if (b.fecha && !FECHA.test(b.fecha)) return 'Fecha inválida';
  return null;
}

// INSERT/UPDATE genéricos sobre la lista blanca de campos
async function guardar(res, tabla, campos, body, id) {
  const ks = campos.filter(k => body[k] !== undefined);
  if (!ks.length) return res.status(400).json({ error: 'Nada que actualizar' });
  try {
    const { rows } = id
      ? await pool.query(`UPDATE ${tabla} SET ${ks.map((k, i) => `${k} = $${i + 1}`).join(', ')} WHERE id = $${ks.length + 1} RETURNING *`,
                         [...ks.map(k => vacio(body[k])), id])
      : await pool.query(`INSERT INTO ${tabla} (${ks.join(', ')}) VALUES (${ks.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
                         ks.map(k => vacio(body[k])));
    if (!rows[0]) return res.status(404).json({ error: 'No encontrado' });
    res.status(id ? 200 : 201).json(rows[0]);
  } catch (e) {
    if (e.code === '23503') return res.status(404).json({ error: 'Cliente no encontrado' });
    throw e;
  }
}

async function borrar(res, tabla, id) {
  const { rowCount } = await pool.query(`DELETE FROM ${tabla} WHERE id = $1`, [id]);
  if (!rowCount) return res.status(404).json({ error: 'No encontrado' });
  res.json({ ok: true });
}

// ── Cobros ── ?estado=pendiente (default) | pagado | todos
router.get('/cobros', async (req, res) => {
  await generarMensualidades();
  const estado = req.query.estado || 'pendiente';
  const where = estado === 'pagado' ? 'b.pagado_el IS NOT NULL' : estado === 'todos' ? 'true' : 'b.pagado_el IS NULL';
  const { rows } = await pool.query(
    `SELECT b.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono
     FROM cobros b JOIN clientes c ON c.id = b.cliente_id
     WHERE ${where} ORDER BY ${estado === 'pagado' ? 'b.pagado_el DESC' : 'b.vence'} LIMIT 1000`);
  res.json(rows);
});

const CAMPOS_COBRO = ['cliente_id', 'sistema_id', 'tipo', 'concepto', 'monto', 'vence', 'pagado_el', 'notas'];
router.post('/cobros', (req, res) => {
  const err = validarCobro(req.body, true);
  if (err) return res.status(400).json({ error: err });
  return guardar(res, 'cobros', CAMPOS_COBRO, { tipo: 'otro', ...req.body });
});
router.put('/cobros/:id', (req, res) => {
  const err = validarCobro(req.body, false);
  if (err) return res.status(400).json({ error: err });
  return guardar(res, 'cobros', CAMPOS_COBRO.filter(k => k !== 'cliente_id'), req.body, req.params.id);
});
router.delete('/cobros/:id', (req, res) => borrar(res, 'cobros', req.params.id));

// ── Gastos ── ?mes=YYYY-MM
router.get('/gastos', async (req, res) => {
  const mes = /^\d{4}-\d{2}$/.test(req.query.mes || '') ? req.query.mes : null;
  const { rows } = await pool.query(
    `SELECT g.*, c.nombre AS cliente_nombre FROM gastos g LEFT JOIN clientes c ON c.id = g.cliente_id
     ${mes ? `WHERE to_char(g.fecha, 'YYYY-MM') = $1` : ''} ORDER BY g.fecha DESC, g.id DESC LIMIT 1000`,
    mes ? [mes] : []);
  res.json(rows);
});

const CAMPOS_GASTO = ['fecha', 'concepto', 'categoria', 'monto', 'cliente_id', 'notas'];
router.post('/gastos', (req, res) => {
  const err = validarGasto(req.body, true);
  if (err) return res.status(400).json({ error: err });
  return guardar(res, 'gastos', CAMPOS_GASTO, req.body);
});
router.put('/gastos/:id', (req, res) => {
  const err = validarGasto(req.body, false);
  if (err) return res.status(400).json({ error: err });
  return guardar(res, 'gastos', CAMPOS_GASTO, req.body, req.params.id);
});
router.delete('/gastos/:id', (req, res) => borrar(res, 'gastos', req.params.id));

// ── Reporte ── ?anio=YYYY: ingreso (lo cobrado, por fecha de pago), gasto y ganancia por mes y por cliente
router.get('/reporte', async (req, res) => {
  const anio = /^\d{4}$/.test(req.query.anio || '') ? Number(req.query.anio) : new Date().getFullYear();
  const [meses, clientes] = await Promise.all([
    pool.query(`
      SELECT m.mes,
             COALESCE((SELECT SUM(monto) FROM cobros WHERE EXTRACT(YEAR FROM pagado_el) = $1 AND EXTRACT(MONTH FROM pagado_el) = m.mes), 0) AS ingreso,
             COALESCE((SELECT SUM(monto) FROM gastos WHERE EXTRACT(YEAR FROM fecha) = $1 AND EXTRACT(MONTH FROM fecha) = m.mes), 0) AS gasto
      FROM generate_series(1, 12) AS m(mes) ORDER BY m.mes`, [anio]),
    pool.query(`
      SELECT c.id, c.nombre,
             COALESCE((SELECT SUM(monto) FROM cobros WHERE cliente_id = c.id AND EXTRACT(YEAR FROM pagado_el) = $1), 0) AS ingreso,
             COALESCE((SELECT SUM(monto) FROM gastos WHERE cliente_id = c.id AND EXTRACT(YEAR FROM fecha) = $1), 0) AS gasto,
             COALESCE((SELECT SUM(monto) FROM cobros WHERE cliente_id = c.id AND pagado_el IS NULL), 0) AS por_cobrar
      FROM clientes c ORDER BY c.nombre`, [anio]),
  ]);
  const { rows: [sin] } = await pool.query(
    'SELECT COALESCE(SUM(monto), 0) AS gasto FROM gastos WHERE cliente_id IS NULL AND EXTRACT(YEAR FROM fecha) = $1', [anio]);
  res.json({ anio, meses: meses.rows, clientes: clientes.rows, gasto_general: sin.gasto });
});

module.exports = router;
