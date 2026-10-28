// Clientes: ficha, sistemas instalados y su estado de cuenta. Se crean a mano o desde un lead ganado.
const router = require('express').Router();
const pool = require('../db/pool');
const { generarMensualidades } = require('../utils/mensualidades');

const CAMPOS = ['nombre', 'contacto', 'telefono', 'email', 'razon_social', 'rfc', 'dia_corte', 'notas', 'activo'];
const CAMPOS_SISTEMA = ['modulo_id', 'nombre', 'url', 'servidor', 'repo', 'fecha_entrega', 'manual_entregado',
                        'capacitacion', 'mensualidad', 'cobrar_desde', 'activo'];

function validar(body) {
  if (body.nombre !== undefined && !body.nombre?.trim()) return 'Nombre requerido';
  if (body.dia_corte !== undefined && !(Number.isInteger(Number(body.dia_corte)) && body.dia_corte >= 1 && body.dia_corte <= 28))
    return 'Día de corte entre 1 y 28';
  if (body.rfc && !/^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/i.test(body.rfc.trim())) return 'RFC inválido';
  return null;
}

function validarSistema(body) {
  if (body.nombre !== undefined && !body.nombre?.trim()) return 'Nombre del sistema requerido';
  if (body.mensualidad !== undefined && !(Number(body.mensualidad || 0) >= 0)) return 'Mensualidad inválida';
  return null;
}

// '' de un formulario → NULL (fechas, módulo); mensualidad vacía → 0
const limpio = (k, v) => (k === 'mensualidad' ? Number(v || 0) : v === '' ? null : k === 'rfc' && v ? v.trim().toUpperCase() : v);

const insertar = (db, tabla, campos, body, extra = {}) => {
  const ks = [...campos.filter(k => body[k] !== undefined), ...Object.keys(extra)];
  return db.query(
    `INSERT INTO ${tabla} (${ks.join(', ')}) VALUES (${ks.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
    ks.map(k => (k in extra ? extra[k] : limpio(k, body[k]))));
};

const actualizar = (tabla, campos, body, where, params) => {
  const ks = campos.filter(k => body[k] !== undefined);
  if (!ks.length) return null;
  return pool.query(
    `UPDATE ${tabla} SET ${ks.map((k, i) => `${k} = $${i + 1}`).join(', ')}${tabla === 'clientes' ? ', updated_at = NOW()' : ''}
     WHERE ${where.replace(/\$(\d)/g, (_, n) => `$${ks.length + Number(n)}`)} RETURNING *`,
    [...ks.map(k => limpio(k, body[k])), ...params]);
};

const siguienteMes = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toLocaleDateString('en-CA');
};

const duplicado = (res, e) => {
  if (e.code === '23505') return res.status(409).json({ error: 'Ya existe un cliente con ese nombre' });
  throw e;
};

router.get('/', async (req, res) => {
  await generarMensualidades();
  const { rows } = await pool.query(`
    SELECT c.*,
           (SELECT COUNT(*)::int FROM sistemas s WHERE s.cliente_id = c.id AND s.activo) AS num_sistemas,
           (SELECT COALESCE(SUM(s.mensualidad), 0) FROM sistemas s WHERE s.cliente_id = c.id AND s.activo) AS mensualidad,
           (SELECT COALESCE(SUM(b.monto), 0) FROM cobros b WHERE b.cliente_id = c.id AND b.pagado_el IS NULL) AS saldo,
           (SELECT COALESCE(SUM(b.monto), 0) FROM cobros b WHERE b.cliente_id = c.id AND b.pagado_el IS NULL AND b.vence < CURRENT_DATE) AS vencido
    FROM clientes c ORDER BY c.activo DESC, c.nombre`);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  await generarMensualidades();
  const { rows } = await pool.query('SELECT * FROM clientes WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Cliente no encontrado' });
  const [sistemas, cobros, gastos] = await Promise.all([
    pool.query(`SELECT s.*, m.nombre AS modulo_nombre FROM sistemas s LEFT JOIN modulos m ON m.id = s.modulo_id
                WHERE s.cliente_id = $1 ORDER BY s.activo DESC, s.nombre`, [req.params.id]),
    pool.query('SELECT * FROM cobros WHERE cliente_id = $1 ORDER BY (pagado_el IS NULL) DESC, vence DESC', [req.params.id]),
    pool.query('SELECT * FROM gastos WHERE cliente_id = $1 ORDER BY fecha DESC', [req.params.id]),
  ]);
  res.json({ ...rows[0], sistemas: sistemas.rows, cobros: cobros.rows, gastos: gastos.rows });
});

router.post('/', async (req, res) => {
  if (!req.body.nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  const err = validar(req.body);
  if (err) return res.status(400).json({ error: err });
  try {
    const { rows } = await insertar(pool, 'clientes', CAMPOS, req.body);
    res.status(201).json(rows[0]);
  } catch (e) { duplicado(res, e); }
});

router.put('/:id', async (req, res) => {
  const err = validar(req.body);
  if (err) return res.status(400).json({ error: err });
  try {
    const r = await actualizar('clientes', CAMPOS, req.body, 'id = $1', [req.params.id]);
    if (!r) return res.status(400).json({ error: 'Nada que actualizar' });
    if (!r.rows[0]) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(r.rows[0]);
  } catch (e) { duplicado(res, e); }
});

router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM clientes WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json({ ok: true });
});

// Lead ganado → cliente con los sistemas y el cobro de desarrollo de su última cotización
router.post('/desde-lead/:leadId', async (req, res) => {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const { rows: [lead] } = await db.query('SELECT * FROM leads WHERE id = $1 FOR UPDATE', [req.params.leadId]);
    if (!lead) { await db.query('ROLLBACK'); return res.status(404).json({ error: 'Lead no encontrado' }); }
    const { rows: [ya] } = await db.query('SELECT id FROM clientes WHERE lead_id = $1', [lead.id]);
    if (ya) { await db.query('ROLLBACK'); return res.status(409).json({ error: 'Este lead ya es cliente', id: ya.id }); }

    const { rows: [cliente] } = await insertar(db, 'clientes', [], {}, {
      nombre: (lead.empresa || lead.nombre).trim(), contacto: lead.nombre, telefono: lead.telefono, lead_id: lead.id,
    });
    const { rows: items } = await db.query(
      `SELECT i.* FROM cotizacion_items i WHERE i.cotizacion_id =
         (SELECT id FROM cotizaciones WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 1) ORDER BY i.id`, [lead.id]);
    for (const it of items) {
      const { rows: [s] } = await insertar(db, 'sistemas', [], {}, {
        cliente_id: cliente.id, modulo_id: it.modulo_id, nombre: it.concepto, mensualidad: it.mensualidad,
        cobrar_desde: siguienteMes(),  // recién ganado: la mensualidad arranca el mes que entra, no hoy
      });
      if (Number(it.precio_desarrollo) > 0)
        await insertar(db, 'cobros', [], {}, {
          cliente_id: cliente.id, sistema_id: s.id, tipo: 'desarrollo', concepto: `Desarrollo · ${it.concepto}`,
          monto: it.precio_desarrollo, vence: new Date().toISOString().slice(0, 10),
        });
    }
    await db.query(`UPDATE leads SET etapa = 'ganado', updated_at = NOW() WHERE id = $1`, [lead.id]);
    await db.query('COMMIT');
    res.status(201).json(cliente);
  } catch (e) {
    await db.query('ROLLBACK');
    if (e.code === '23505') return res.status(409).json({ error: 'Ya existe un cliente con ese nombre; cámbiale el nombre o la empresa al lead' });
    throw e;
  } finally {
    db.release();
  }
});

router.post('/:id/sistemas', async (req, res) => {
  if (!req.body.nombre?.trim()) return res.status(400).json({ error: 'Nombre del sistema requerido' });
  const err = validarSistema(req.body);
  if (err) return res.status(400).json({ error: err });
  try {
    const { rows } = await insertar(pool, 'sistemas', CAMPOS_SISTEMA, req.body, { cliente_id: req.params.id });
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23503') return res.status(404).json({ error: 'Cliente o módulo no encontrado' });
    throw e;
  }
});

router.put('/:id/sistemas/:sid', async (req, res) => {
  const err = validarSistema(req.body);
  if (err) return res.status(400).json({ error: err });
  const r = await actualizar('sistemas', CAMPOS_SISTEMA, req.body, 'id = $1 AND cliente_id = $2', [req.params.sid, req.params.id]);
  if (!r) return res.status(400).json({ error: 'Nada que actualizar' });
  if (!r.rows[0]) return res.status(404).json({ error: 'Sistema no encontrado' });
  res.json(r.rows[0]);
});

router.delete('/:id/sistemas/:sid', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM sistemas WHERE id = $1 AND cliente_id = $2', [req.params.sid, req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Sistema no encontrado' });
  res.json({ ok: true });
});

module.exports = router;
