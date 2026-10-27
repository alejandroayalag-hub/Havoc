// Material de marketing: logos, presentaciones, videos demo para mandar a leads
const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('../db/pool');
const { requireRol } = require('../middleware/roles');

const DIR = path.join(__dirname, '..', '..', 'uploads', 'materiales');
const TIPOS = ['logo', 'presentacion', 'video', 'documento', 'imagen', 'otro'];
// Sin SVG/HTML: /uploads se sirve desde el mismo origen que la app (riesgo de XSS)
const EXT = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.ppt', '.pptx', '.doc', '.docx', '.mp4', '.mov', '.zip'];

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) { fs.mkdirSync(DIR, { recursive: true }); cb(null, DIR); },
    filename(req, file, cb) {
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  fileFilter(req, file, cb) {
    if (EXT.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(Object.assign(new Error(`Tipo de archivo no permitido. Use ${EXT.join(' ')}`), { status: 400 }));
  },
  limits: { fileSize: 200 * 1024 * 1024 },
});

const borrarArchivo = (archivo) => archivo && fs.rm(path.join(DIR, path.basename(archivo)), { force: true }, () => {});

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT m.*, mo.nombre AS modulo_nombre FROM materiales m
     LEFT JOIN modulos mo ON mo.id = m.modulo_id ORDER BY m.tipo, m.titulo`);
  res.json(rows);
});

router.post('/', upload.single('archivo'), async (req, res) => {
  const { titulo, tipo = 'otro', url, modulo_id, notas } = req.body;
  const archivo = req.file && `materiales/${req.file.filename}`;
  const falla = !titulo?.trim() ? 'Título requerido'
    : !TIPOS.includes(tipo) ? 'Tipo inválido'
    : !archivo && !url?.trim() ? 'Sube un archivo o pega una liga'
    : url?.trim() && !/^https?:\/\//i.test(url.trim()) ? 'La liga debe empezar con http:// o https://'
    : null;
  if (falla) { borrarArchivo(archivo); return res.status(400).json({ error: falla }); }
  const { rows } = await pool.query(
    `INSERT INTO materiales (titulo, tipo, archivo, url, modulo_id, notas, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [titulo.trim(), tipo, archivo || null, archivo ? null : url.trim(), modulo_id || null, notas || null, req.user.id]);
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const { titulo, tipo, modulo_id, notas } = req.body;
  if (titulo !== undefined && !titulo?.trim()) return res.status(400).json({ error: 'Título requerido' });
  if (tipo !== undefined && !TIPOS.includes(tipo)) return res.status(400).json({ error: 'Tipo inválido' });
  const { rows } = await pool.query(
    `UPDATE materiales SET titulo = COALESCE($1, titulo), tipo = COALESCE($2, tipo),
            modulo_id = $3, notas = $4 WHERE id = $5 RETURNING *`,
    [titulo?.trim() || null, tipo || null, modulo_id || null, notas || null, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Material no encontrado' });
  res.json(rows[0]);
});

router.delete('/:id', requireRol('admin'), async (req, res) => {
  const { rows } = await pool.query('DELETE FROM materiales WHERE id = $1 RETURNING archivo', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Material no encontrado' });
  borrarArchivo(rows[0].archivo);
  res.json({ ok: true });
});

module.exports = router;
