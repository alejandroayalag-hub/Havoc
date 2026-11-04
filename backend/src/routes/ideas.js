// Ideas de módulos nuevos: necesidades que piden leads/clientes. Nueva → En evaluación → Empaquetar → Catálogo / Descartada.
const router = require('express').Router();
const pool = require('../db/pool');
const { requireRol } = require('../middleware/roles');

const ESTADOS = ['nueva', 'evaluacion', 'empaquetar', 'catalogo', 'descartada'];
const CAMPOS = ['titulo', 'descripcion', 'existe_en', 'estado'];
const nulo = v => (v === '' || v === undefined ? null : v);

function validar(b, nueva) {
  if ((nueva || b.titulo !== undefined) && !b.titulo?.trim()) return 'Título requerido';
  if (b.estado !== undefined && !ESTADOS.includes(b.estado)) return 'Estado inválido';
  return null;
}

const duplicada = (res, e) => {
  if (e.code === '23505') return res.status(409).json({ error: 'Ya existe una idea con ese título; agrégale la solicitud a esa' });
  throw e;
};

const insertarSolicitud = (db, ideaId, s, userId) => db.query(
  `INSERT INTO idea_solicitudes (idea_id, lead_id, cliente_id, nota, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
  [ideaId, nulo(s.lead_id), nulo(s.cliente_id), nulo(s.nota?.trim()), userId]);

// ?lead_id=X o ?cliente_id=X → solo las que pidió ese lead/cliente
router.get('/', async (req, res) => {
  const { lead_id, cliente_id } = req.query;
  const { rows } = await pool.query(`
    SELECT i.*, m.nombre AS modulo_nombre,
           -- personas distintas: el mismo lead/cliente anotado dos veces cuenta una
           (SELECT COUNT(DISTINCT COALESCE('c' || s.cliente_id, 'l' || s.lead_id, 's' || s.id))::int
              FROM idea_solicitudes s WHERE s.idea_id = i.id) AS num_solicitudes,
           (SELECT string_agg(DISTINCT COALESCE(c.nombre, l.nombre), ', ')
              FROM idea_solicitudes s LEFT JOIN leads l ON l.id = s.lead_id LEFT JOIN clientes c ON c.id = s.cliente_id
              WHERE s.idea_id = i.id) AS quienes
    FROM ideas i LEFT JOIN modulos m ON m.id = i.modulo_id
    WHERE ($1::int IS NULL OR EXISTS (SELECT 1 FROM idea_solicitudes s WHERE s.idea_id = i.id AND s.lead_id = $1))
      AND ($2::int IS NULL OR EXISTS (SELECT 1 FROM idea_solicitudes s WHERE s.idea_id = i.id AND s.cliente_id = $2))
    ORDER BY num_solicitudes DESC, i.updated_at DESC`, [nulo(lead_id), nulo(cliente_id)]);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows: [idea] } = await pool.query(
    'SELECT i.*, m.nombre AS modulo_nombre FROM ideas i LEFT JOIN modulos m ON m.id = i.modulo_id WHERE i.id = $1', [req.params.id]);
  if (!idea) return res.status(404).json({ error: 'No existe' });
  const { rows: solicitudes } = await pool.query(`
    SELECT s.*, l.nombre AS lead_nombre, c.nombre AS cliente_nombre, u.nombre AS anoto
    FROM idea_solicitudes s LEFT JOIN leads l ON l.id = s.lead_id LEFT JOIN clientes c ON c.id = s.cliente_id
    LEFT JOIN usuarios u ON u.id = s.created_by
    WHERE s.idea_id = $1 ORDER BY s.created_at DESC`, [req.params.id]);
  res.json({ ...idea, solicitudes });
});

// Crea la idea y, si viene `solicitud`, la primera solicitud (desde la ficha del lead/cliente)
router.post('/', async (req, res) => {
  const err = validar(req.body, true);
  if (err) return res.status(400).json({ error: err });
  if (req.body.estado === 'catalogo') return res.status(400).json({ error: 'Una idea nueva no puede ir directo al catálogo' });
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const { rows: [idea] } = await db.query(
      `INSERT INTO ideas (titulo, descripcion, existe_en, estado, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.body.titulo.trim(), nulo(req.body.descripcion), nulo(req.body.existe_en), req.body.estado || 'nueva', req.user.id]);
    if (req.body.solicitud) await insertarSolicitud(db, idea.id, req.body.solicitud, req.user.id);
    await db.query('COMMIT');
    res.status(201).json(idea);
  } catch (e) {
    await db.query('ROLLBACK');
    duplicada(res, e);
  } finally { db.release(); }
});

// Pasar a "catalogo" (solo admin) crea el módulo como "sin empaquetar", o liga uno existente con el mismo nombre
router.put('/:id', async (req, res) => {
  const err = validar(req.body, false);
  if (err) return res.status(400).json({ error: err });
  if (req.body.estado === 'catalogo' && req.user.rol !== 'admin') return res.status(403).json({ error: 'Solo un admin pasa ideas al catálogo' });
  const ks = CAMPOS.filter(k => req.body[k] !== undefined);
  if (!ks.length) return res.status(400).json({ error: 'Nada que actualizar' });
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const { rows: [idea] } = await db.query(
      `UPDATE ideas SET ${ks.map((k, i) => `${k} = $${i + 1}`).join(', ')}, updated_at = NOW() WHERE id = $${ks.length + 1} RETURNING *`,
      [...ks.map(k => (k === 'titulo' ? req.body.titulo.trim() : nulo(req.body[k]))), req.params.id]);
    if (!idea) { await db.query('ROLLBACK'); return res.status(404).json({ error: 'No existe' }); }
    if (idea.estado === 'catalogo' && !idea.modulo_id) {
      const { rows: [m] } = await db.query(`
        INSERT INTO modulos (nombre, descripcion, estado, proyecto_origen) VALUES ($1, $2, 'sin_empaquetar', $3)
        ON CONFLICT (nombre) DO UPDATE SET updated_at = NOW() RETURNING id`,
        [idea.titulo, idea.descripcion, idea.existe_en]);
      await db.query('UPDATE ideas SET modulo_id = $1 WHERE id = $2', [m.id, idea.id]);
      idea.modulo_id = m.id;
    }
    await db.query('COMMIT');
    res.json(idea);
  } catch (e) {
    await db.query('ROLLBACK');
    duplicada(res, e);
  } finally { db.release(); }
});

router.delete('/:id', requireRol('admin'), async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM ideas WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'No existe' });
  res.json({ ok: true });
});

router.post('/:id/solicitudes', async (req, res) => {
  const { rows: [s] } = await insertarSolicitud(pool, req.params.id, req.body, req.user.id)
    .catch(e => { if (e.code === '23503') return { rows: [] }; throw e; });
  if (!s) return res.status(404).json({ error: 'La idea, el lead o el cliente no existe' });
  await pool.query('UPDATE ideas SET updated_at = NOW() WHERE id = $1', [req.params.id]);
  res.status(201).json(s);
});

router.delete('/:id/solicitudes/:sid', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM idea_solicitudes WHERE id = $1 AND idea_id = $2', [req.params.sid, req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'No existe' });
  res.json({ ok: true });
});

module.exports = router;
