// Catálogo de módulos: vitrina interna de lo ya construido
const router = require('express').Router();
const pool = require('../db/pool');
const { requireRol } = require('../middleware/roles');

const CAMPOS = ['nombre', 'descripcion', 'para_quien', 'funciones', 'precio_desarrollo',
                'mensualidad', 'estado', 'proyecto_origen', 'activo', 'demo_url'];
const ESTADOS = ['listo', 'sin_empaquetar'];

function validar(body) {
  if (body.estado !== undefined && !ESTADOS.includes(body.estado)) return 'Estado inválido';
  for (const k of ['precio_desarrollo', 'mensualidad'])
    if (body[k] !== undefined && body[k] !== null && body[k] !== '' && !(Number(body[k]) >= 0)) return `${k} inválido`;
  if (body.demo_url && !/^https?:\/\//.test(body.demo_url)) return 'La URL de la demo debe empezar con http:// o https://';
  return null;
}

// '' en precios → NULL (precio sin definir)
const valor = (k, v) => (['precio_desarrollo', 'mensualidad', 'demo_url'].includes(k) && v === '' ? null : v);

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM modulos ${req.query.todos ? '' : 'WHERE activo'} ORDER BY nombre`);
  res.json(rows);
});

router.post('/', requireRol('admin'), async (req, res) => {
  if (!req.body.nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  const err = validar(req.body);
  if (err) return res.status(400).json({ error: err });
  const campos = CAMPOS.filter(k => req.body[k] !== undefined);
  try {
    const { rows } = await pool.query(
      `INSERT INTO modulos (${campos.join(', ')}) VALUES (${campos.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
      campos.map(k => valor(k, req.body[k])));
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Ya existe un módulo con ese nombre' });
    throw e;
  }
});

router.put('/:id', requireRol('admin'), async (req, res) => {
  const err = validar(req.body);
  if (err) return res.status(400).json({ error: err });
  const campos = CAMPOS.filter(k => req.body[k] !== undefined);
  if (!campos.length) return res.status(400).json({ error: 'Nada que actualizar' });
  try {
    const { rows } = await pool.query(
      `UPDATE modulos SET ${campos.map((k, i) => `${k} = $${i + 1}`).join(', ')}, updated_at = NOW()
       WHERE id = $${campos.length + 1} RETURNING *`,
      [...campos.map(k => valor(k, req.body[k])), req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Módulo no encontrado' });
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Ya existe un módulo con ese nombre' });
    throw e;
  }
});

module.exports = router;
