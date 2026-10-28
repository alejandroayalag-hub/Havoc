import { useEffect, useState } from 'react';
import { ExternalLink, Pencil, X } from 'lucide-react';
import { getModulos, createModulo, updateModulo, dinero } from '../api/ventas';

const input = 'w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300';
const ESTADO = {
  listo:          { label: 'Listo para vender', color: '#15803D' },
  sin_empaquetar: { label: 'Sin empaquetar',    color: '#B45309' },
};
const VACIO = { nombre: '', descripcion: '', para_quien: '', funciones: '', precio_desarrollo: '',
                mensualidad: '', estado: 'listo', proyecto_origen: '', activo: true, demo_url: '' };

export default function CatalogoPage() {
  const esAdmin = localStorage.getItem('rol') === 'admin';
  const [modulos, setModulos] = useState([]);
  const [editando, setEditando] = useState(null); // null | módulo (id ausente = nuevo)
  const [verInactivos, setVerInactivos] = useState(false);

  const cargar = () => getModulos({ todos: 1 }).then(setModulos).catch(() => {});
  useEffect(() => { cargar(); }, []);

  const visibles = modulos.filter(m => verInactivos || m.activo);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Catálogo de módulos</h1>
        <label className="text-xs flex items-center gap-1 opacity-70 ml-auto">
          <input type="checkbox" checked={verInactivos} onChange={e => setVerInactivos(e.target.checked)} /> Ver inactivos
        </label>
        {esAdmin && (
          <button onClick={() => setEditando(VACIO)} className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: 'var(--color-accent)' }}>
            + Nuevo módulo
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibles.map(m => (
          <div key={m.id}
               className={`group relative text-left bg-white border rounded-xl p-5 flex flex-col hover:shadow-md ${m.activo ? '' : 'opacity-50'}`}
               style={{ borderColor: 'var(--color-sage)' }}>
            {/* Vista previa al pasar el cursor (solo escritorio) */}
            {m.miniatura && (
              <img src={m.miniatura} alt={`Vista previa de ${m.nombre}`} loading="lazy"
                   className="hidden md:group-hover:block absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[34rem] max-w-[90vw] rounded-lg shadow-2xl border-2 z-30 pointer-events-none"
                   style={{ borderColor: 'var(--color-violet)' }} />
            )}
            <div className="flex items-start gap-2 mb-1">
              <h2 className="font-semibold flex-1">{m.nombre}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                    style={{ backgroundColor: ESTADO[m.estado].color }}>{ESTADO[m.estado].label}</span>
              {esAdmin && (
                <button onClick={() => setEditando(m)} aria-label={`Editar ${m.nombre}`} className="opacity-60 hover:opacity-100">
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            {m.proyecto_origen && <p className="font-mono text-[11px] mb-2" style={{ color: 'var(--color-accent)' }}>{m.proyecto_origen}</p>}
            <p className="text-sm opacity-80 mb-2">{m.descripcion}</p>
            {m.para_quien && <p className="text-xs opacity-60 mb-1"><b>Para:</b> {m.para_quien}</p>}
            {m.funciones && <p className="text-xs opacity-60 mb-3"><b>Incluye:</b> {m.funciones}</p>}
            <div className="mt-auto flex gap-4 pt-3 border-t text-sm" style={{ borderColor: 'var(--color-sage)' }}>
              <span><span className="text-xs opacity-50 block">Desarrollo</span><span className="font-mono">{dinero(m.precio_desarrollo)}</span></span>
              <span><span className="text-xs opacity-50 block">Mensualidad</span><span className="font-mono">{dinero(m.mensualidad)}</span></span>
              {m.demo_url
                ? <a href={m.demo_url} target="_blank" rel="noreferrer"
                     className="ml-auto self-center flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-white whitespace-nowrap"
                     style={{ backgroundColor: 'var(--color-accent)' }}>
                    Ver funcionando <ExternalLink className="w-3 h-3" />
                  </a>
                : <span className="ml-auto self-center text-[11px] opacity-40">Demo pendiente</span>}
            </div>
            <p className="text-[11px] opacity-50 mt-1">Desarrollo incluye diseño, adecuación e implementación.</p>
          </div>
        ))}
      </div>

      {editando && <ModuloModal modulo={editando} onClose={() => setEditando(null)} onSave={() => { setEditando(null); cargar(); }} />}
    </div>
  );
}

function ModuloModal({ modulo, onClose, onSave }) {
  const [form, setForm] = useState({ ...VACIO, ...modulo,
    precio_desarrollo: modulo.precio_desarrollo ?? '', mensualidad: modulo.mensualidad ?? '', demo_url: modulo.demo_url ?? '' });
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function guardar(e) {
    e.preventDefault();
    setError('');
    const datos = Object.fromEntries(Object.keys(VACIO).map(k => [k, form[k]]));
    try {
      if (modulo.id) await updateModulo(modulo.id, datos); else await createModulo(datos);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar');
    }
  }

  const campo = (k, label, props = {}) => (
    <label className="block">
      <span className="text-xs font-medium opacity-70">{label}</span>
      {props.rows
        ? <textarea className={input} value={form[k]} onChange={e => set(k, e.target.value)} {...props} />
        : <input className={input} value={form[k]} onChange={e => set(k, e.target.value)} {...props} />}
    </label>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <form onSubmit={guardar} onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-3">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold flex-1">{modulo.id ? 'Editar módulo' : 'Nuevo módulo'}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>
        {campo('nombre', 'Nombre *', { required: true })}
        {campo('descripcion', 'Descripción corta', { rows: 2 })}
        {campo('para_quien', 'Para quién sirve')}
        {campo('funciones', 'Funciones principales', { rows: 3 })}
        <div className="grid grid-cols-2 gap-3">
          {campo('precio_desarrollo', 'Precio desarrollo (MXN)', { type: 'number', min: 0, step: '0.01', className: `${input} font-mono` })}
          {campo('mensualidad', 'Mensualidad (MXN)', { type: 'number', min: 0, step: '0.01', className: `${input} font-mono` })}
        </div>
        {campo('demo_url', 'URL de la demo (ver funcionando)', { type: 'url', placeholder: 'http://…' })}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium opacity-70">Estado</span>
            <select className={input} value={form.estado} onChange={e => set('estado', e.target.value)}>
              {Object.entries(ESTADO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
          {campo('proyecto_origen', 'Proyecto de origen')}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} /> Activo (aparece al cotizar)
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-lg py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-accent)' }}>
          Guardar
        </button>
      </form>
    </div>
  );
}
