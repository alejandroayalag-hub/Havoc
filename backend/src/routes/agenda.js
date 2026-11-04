// Agenda: eventos propios (reunión/entrega/capacitación) + cobros pendientes (solo admin) + eventos externos
// del calendario CalDAV de ventas@ (llamadas que agenda el bot). Los propios se espejean a ese calendario.
const router = require('express').Router();
const pool = require('../db/pool');
const caldav = require('../utils/caldav');
const { generarMensualidades } = require('../utils/mensualidades');

const TIPOS = ['reunion', 'entrega', 'capacitacion'];
const CAMPOS = ['tipo', 'titulo', 'inicio', 'fin', 'lead_id', 'cliente_id', 'notas'];

function validar(b) {
  if (!TIPOS.includes(b.tipo)) return 'Tipo inválido';
  if (!b.titulo?.trim()) return 'Título requerido';
  const i = new Date(b.inicio), f = new Date(b.fin);
  if (isNaN(i) || isNaN(f)) return 'Fecha inválida';
  if (f <= i) return 'La hora de fin debe ser después del inicio';
  return null;
}

const valores = b => CAMPOS.map(k => (b[k] === '' || b[k] === undefined ? null : b[k]));

// Intenta espejear al calendario; si falla, el evento queda en la base y se reintenta al editarlo.
async function sincronizar(ev) {
  if (!caldav.activo()) return { ...ev, caldav: 'apagado' };
  try {
    const url = await caldav.guardar(ev);
    if (url !== ev.caldav_url) await pool.query('UPDATE eventos SET caldav_url = $1 WHERE id = $2', [url, ev.id]);
    return { ...ev, caldav_url: url, caldav: 'ok' };
  } catch (e) {
    console.error('CalDAV guardar:', e.message);
    return { ...ev, caldav: 'error' };
  }
}

router.get('/', async (req, res) => {
  const { desde, hasta } = req.query;
  if (!desde || !hasta || isNaN(new Date(desde)) || isNaN(new Date(hasta))) return res.status(400).json({ error: 'Rango inválido' });

  const { rows: propios } = await pool.query(`
    SELECT e.*, l.nombre AS lead_nombre, c.nombre AS cliente_nombre
    FROM eventos e LEFT JOIN leads l ON l.id = e.lead_id LEFT JOIN clientes c ON c.id = e.cliente_id
    WHERE e.inicio < $2 AND e.fin > $1 ORDER BY e.inicio`, [desde, hasta]);

  let cobros = [];
  if (req.user.rol === 'admin') {
    await generarMensualidades();
    ({ rows: cobros } = await pool.query(`
      SELECT b.id, b.concepto, b.monto, b.vence, b.cliente_id, c.nombre AS cliente_nombre
      FROM cobros b JOIN clientes c ON c.id = b.cliente_id
      WHERE b.pagado_el IS NULL AND b.vence >= $1::date AND b.vence < $2::date ORDER BY b.vence`, [desde, hasta]));
  }

  let externos = [], estado = 'apagado';
  if (caldav.activo()) {
    try { externos = await caldav.externos(desde, hasta); estado = 'ok'; }
    catch (e) { console.error('CalDAV leer:', e.message); estado = 'error'; }
  }

  res.json({ eventos: propios, cobros, externos, caldav: estado });
});

router.post('/', async (req, res) => {
  const err = validar(req.body);
  if (err) return res.status(400).json({ error: err });
  const { rows: [ev] } = await pool.query(
    `INSERT INTO eventos (${CAMPOS.join(', ')}, creado_por) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [...valores({ ...req.body, titulo: req.body.titulo.trim() }), req.user.id]);
  res.status(201).json(await sincronizar(ev));
});

router.put('/:id', async (req, res) => {
  const err = validar(req.body);
  if (err) return res.status(400).json({ error: err });
  const { rows: [ev] } = await pool.query(
    `UPDATE eventos SET ${CAMPOS.map((k, i) => `${k} = $${i + 1}`).join(', ')} WHERE id = $8 RETURNING *`,
    [...valores({ ...req.body, titulo: req.body.titulo.trim() }), req.params.id]);
  if (!ev) return res.status(404).json({ error: 'No existe' });
  res.json(await sincronizar(ev));
});

router.delete('/:id', async (req, res) => {
  const { rows: [ev] } = await pool.query('DELETE FROM eventos WHERE id = $1 RETURNING *', [req.params.id]);
  if (!ev) return res.status(404).json({ error: 'No existe' });
  let estado = 'apagado';
  if (caldav.activo() && ev.caldav_url) {
    try { await caldav.borrar(ev); estado = 'ok'; }
    catch (e) { console.error('CalDAV borrar:', e.message); estado = 'error'; }
  }
  res.json({ ok: true, caldav: estado });
});

module.exports = router;
