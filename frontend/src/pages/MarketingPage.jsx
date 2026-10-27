import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import MaterialCard from '../components/MaterialCard';
import { getMateriales, createMaterial, updateMaterial, deleteMaterial, getModulos, TIPOS_MATERIAL } from '../api/ventas';

const input = 'w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300';

export default function MarketingPage() {
  const [materiales, setMateriales] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [tipo, setTipo] = useState('');
  const [editando, setEditando] = useState(null); // null | {} nuevo | material

  const cargar = () => getMateriales().then(setMateriales).catch(() => {});
  useEffect(() => { cargar(); getModulos().then(setModulos).catch(() => {}); }, []);

  const visibles = materiales.filter(m => !tipo || m.tipo === tipo);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Material de marketing</h1>
        <button onClick={() => setEditando({})} className="ml-auto rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: 'var(--color-accent)' }}>
          + Agregar material
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[['', 'Todos'], ...Object.entries(TIPOS_MATERIAL)].map(([k, label]) => (
          <button key={k} onClick={() => setTipo(k)} className="text-xs px-3 py-1.5 rounded-full border"
                  style={tipo === k
                    ? { backgroundColor: 'var(--color-accent)', color: 'white', borderColor: 'var(--color-accent)' }
                    : { borderColor: 'var(--color-sage)' }}>
            {label} <span className="font-mono opacity-70">{k ? materiales.filter(m => m.tipo === k).length : materiales.length}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {visibles.map(m => <MaterialCard key={m.id} m={m} onEditar={setEditando} />)}
        {!visibles.length && <p className="text-sm opacity-50">Sin material.</p>}
      </div>

      {editando && <MaterialModal material={editando} modulos={modulos}
                                  onClose={() => setEditando(null)} onSave={() => { setEditando(null); cargar(); }} />}
    </div>
  );
}

function MaterialModal({ material, modulos, onClose, onSave }) {
  const nuevo = !material.id;
  const [form, setForm] = useState({
    titulo: material.titulo || '', tipo: material.tipo || 'presentacion', modulo_id: material.modulo_id || '',
    notas: material.notas || '', url: '',
  });
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const esAdmin = localStorage.getItem('rol') === 'admin';
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      if (nuevo) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
        if (archivo) fd.append('archivo', archivo);
        await createMaterial(fd);
      } else {
        await updateMaterial(material.id, { titulo: form.titulo, tipo: form.tipo, modulo_id: form.modulo_id, notas: form.notas });
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function borrar() {
    if (!window.confirm(`¿Borrar "${material.titulo}"?`)) return;
    try { await deleteMaterial(material.id); onSave(); } catch (err) { setError(err.response?.data?.error || 'No se pudo borrar'); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <form onSubmit={guardar} onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold flex-1">{nuevo ? 'Agregar material' : 'Editar material'}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>
        <label className="block">
          <span className="text-xs font-medium opacity-70">Título *</span>
          <input className={input} required value={form.titulo} onChange={e => set('titulo', e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium opacity-70">Tipo</span>
            <select className={input} value={form.tipo} onChange={e => set('tipo', e.target.value)}>
              {Object.entries(TIPOS_MATERIAL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium opacity-70">Módulo</span>
            <select className={input} value={form.modulo_id} onChange={e => set('modulo_id', e.target.value)}>
              <option value="">General (HAVOC)</option>
              {modulos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </label>
        </div>
        {nuevo && (
          <div className="space-y-2">
            <label className="block">
              <span className="text-xs font-medium opacity-70">Archivo (PDF, imagen, PowerPoint, Word, video, zip — hasta 200 MB)</span>
              <input type="file" className={input} onChange={e => setArchivo(e.target.files[0] || null)}
                     accept=".pdf,.jpg,.jpeg,.png,.webp,.ppt,.pptx,.doc,.docx,.mp4,.mov,.zip" />
            </label>
            {!archivo && (
              <label className="block">
                <span className="text-xs font-medium opacity-70">…o liga (YouTube, Drive)</span>
                <input className={input} type="url" placeholder="https://" value={form.url} onChange={e => set('url', e.target.value)} />
              </label>
            )}
          </div>
        )}
        <label className="block">
          <span className="text-xs font-medium opacity-70">Notas</span>
          <textarea className={input} rows={2} value={form.notas} onChange={e => set('notas', e.target.value)} />
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex items-center gap-3">
          <button disabled={guardando} className="flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-accent)' }}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
          {!nuevo && esAdmin && <button type="button" onClick={borrar} className="text-xs text-red-500 hover:underline">Borrar</button>}
        </div>
      </form>
    </div>
  );
}
