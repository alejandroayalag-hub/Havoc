// Leads de venta: alta rápida, etapas y cotizaciones armadas desde el catálogo
const router = require('express').Router();
const pool = require('../db/pool');
const { requireRol } = require('../middleware/roles');

const CAMPOS = ['nombre', 'telefono', 'empresa', 'recomendado_por', 'necesidad',
                'etapa', 'motivo_perdida', 'notas'];
const ETAPAS = ['nuevo', 'reunion', 'cotizacion', 'ganado', 'perdido'];

router.get('/', async (req, res) => {
  const where = [], values = [];
  if (ETAPAS.includes(req.query.etapa)) { values.push(req.query.etapa); where.push(`l.etapa = $${values.length}`); }
  if (req.query.q) {
    values.push(`%${req.query.q}%`);
    where.push(`(l.nombre ILIKE $${values.length} OR l.empresa ILIKE $${values.length} OR l.telefono ILIKE $${values.length} OR l.necesidad ILIKE $${values.length})`);
  }
  const { rows } = await pool.query(
    `SELECT l.*, u.nombre AS creado_por_nombre,
            (SELECT COUNT(*)::int FROM cotizaciones c WHERE c.lead_id = l.id) AS num_cotizaciones
     FROM leads l LEFT JOIN usuarios u ON u.id = l.created_by
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY l.updated_at DESC`, values);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT l.*, u.nombre AS creado_por_nombre, (SELECT id FROM clientes WHERE lead_id = l.id) AS cliente_id
     FROM leads l LEFT JOIN usuarios u ON u.id = l.created_by WHERE l.id = $1`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Lead no encontrado' });
  const { rows: cotizaciones } = await pool.query(
    `SELECT c.*, u.nombre AS creado_por_nombre,
            COALESCE(json_agg(i ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
     FROM cotizaciones c
     LEFT JOIN cotizacion_items i ON i.cotizacion_id = c.id
     LEFT JOIN usuarios u ON u.id = c.created_by
     WHERE c.lead_id = $1 GROUP BY c.id, u.nombre ORDER BY c.created_at DESC`, [req.params.id]);
  res.json({ ...rows[0], cotizaciones });
});

router.post('/', async (req, res) => {
  if (!req.body.nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  if (req.body.etapa !== undefined && !ETAPAS.includes(req.body.etapa)) return res.status(400).json({ error: 'Etapa inválida' });
  const campos = CAMPOS.filter(k => req.body[k] !== undefined);
  const { rows } = await pool.query(
    `INSERT INTO leads (${[...campos, 'created_by'].join(', ')})
     VALUES (${[...campos, 'created_by'].map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
    [...campos.map(k => req.body[k]), req.user.id]);
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  if (req.body.etapa !== undefined && !ETAPAS.includes(req.body.etapa)) return res.status(400).json({ error: 'Etapa inválida' });
  if (req.body.nombre !== undefined && !req.body.nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  const campos = CAMPOS.filter(k => req.body[k] !== undefined);
  if (!campos.length) return res.status(400).json({ error: 'Nada que actualizar' });
  const { rows } = await pool.query(
    `UPDATE leads SET ${campos.map((k, i) => `${k} = $${i + 1}`).join(', ')}, updated_at = NOW()
     WHERE id = $${campos.length + 1} RETURNING *`,
    [...campos.map(k => req.body[k]), req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Lead no encontrado' });
  res.json(rows[0]);
});

router.delete('/:id', requireRol('admin'), async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM leads WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Lead no encontrado' });
  res.json({ ok: true });
});

// Cotización: items = [{ modulo_id?, concepto, precio_desarrollo, mensualidad }]
router.post('/:id/cotizaciones', async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: 'La cotización necesita al menos un concepto' });
  for (const it of items) {
    if (!it.concepto?.trim()) return res.status(400).json({ error: 'Cada línea necesita concepto' });
    if (!(Number(it.precio_desarrollo || 0) >= 0) || !(Number(it.mensualidad || 0) >= 0))
      return res.status(400).json({ error: 'Montos inválidos' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO cotizaciones (lead_id, notas, created_by) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, req.body.notas || null, req.user.id]);
    for (const it of items)
      await client.query(
        `INSERT INTO cotizacion_items (cotizacion_id, modulo_id, concepto, precio_desarrollo, mensualidad)
         VALUES ($1, $2, $3, $4, $5)`,
        [rows[0].id, it.modulo_id || null, it.concepto.trim(), Number(it.precio_desarrollo || 0), Number(it.mensualidad || 0)]);
    // Cotizar avanza el lead si aún estaba al inicio del embudo
    await client.query(
      `UPDATE leads SET etapa = 'cotizacion', updated_at = NOW() WHERE id = $1 AND etapa IN ('nuevo', 'reunion')`,
      [req.params.id]);
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23503') return res.status(404).json({ error: 'Lead no encontrado' });
    throw e;
  } finally {
    client.release();
  }
});

router.delete('/:id/cotizaciones/:cid', async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM cotizaciones WHERE id = $1 AND lead_id = $2', [req.params.cid, req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Cotización no encontrada' });
  res.json({ ok: true });
});

module.exports = router;
