// Recados tipo post-it: para todos (para_id NULL) o para una persona. Solo los ven autor y destinatario.
const router = require('express').Router();
const pool = require('../db/pool');

const COLORES = ['amarillo', 'rosa', 'verde', 'azul'];
const visible = 'r.hecho_at IS NULL AND (r.para_id IS NULL OR r.para_id = $1 OR r.autor_id = $1)';

router.get('/', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT r.*, a.nombre AS autor_nombre, p.nombre AS para_nombre
    FROM recados r LEFT JOIN usuarios a ON a.id = r.autor_id LEFT JOIN usuarios p ON p.id = r.para_id
    WHERE ${visible} ORDER BY r.created_at DESC`, [req.user.id]);
  res.json(rows);
});

// Para el selector "Para:" (GET /usuarios es solo admin)
router.get('/usuarios', async (req, res) => {
  const { rows } = await pool.query('SELECT id, nombre FROM usuarios ORDER BY nombre');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const texto = req.body.texto?.trim();
  if (!texto) return res.status(400).json({ error: 'Escribe el recado' });
  if (texto.length > 500) return res.status(400).json({ error: 'Máximo 500 caracteres' });
  const color = COLORES.includes(req.body.color) ? req.body.color : 'amarillo';
  const { rows: [r] } = await pool.query(
    'INSERT INTO recados (texto, color, autor_id, para_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [texto, color, req.user.id, req.body.para_id || null]);
  res.status(201).json(r);
});

// ✓ hecho: solo quien lo puede ver
router.post('/:id/hecho', async (req, res) => {
  const { rowCount } = await pool.query(
    `UPDATE recados r SET hecho_at = NOW(), hecho_por = $1 WHERE r.id = $2 AND ${visible}`, [req.user.id, req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'No existe' });
  res.json({ ok: true });
});

module.exports = router;
