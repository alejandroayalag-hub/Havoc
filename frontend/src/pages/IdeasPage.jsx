import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import {
  getIdeas, getIdea, createIdea, updateIdea, deleteIdea, addSolicitud, deleteSolicitud, ESTADOS_IDEA, estadoIdea,
} from '../api/ideas';
import { getLeads } from '../api/ventas';
import { getClientes, fechaCorta } from '../api/clientes';

const input = 'w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300';
const borde = { borderColor: 'var(--color-sage)' };
const boton = 'rounded-lg px-4 py-2 text-sm font-medium text-white';
const acento = { backgroundColor: 'var(--color-accent)' };
// Por omisión se ocultan las cerradas (en catálogo / descartadas)
const ABIERTAS = ['nueva', 'evaluacion', 'empaquetar'];

export default function IdeasPage() {
  const rol = localStorage.getItem('rol');
  const [params, setParams] = useSearchParams();
  const selId = params.get('id');
  const [ideas, setIdeas] = useState([]);
  const [filtro, setFiltro] = useState('abiertas');
  const [idea, setIdea] = useState(null);     // detalle seleccionado (con solicitudes)
  const [form, setForm] = useState(null);     // edición del detalle
  const [nueva, setNueva] = useState(null);
  const [sol, setSol] = useState({ quien: '', nota: '' });
  const [leads, setLeads] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState('');

  const cargar = () => getIdeas().then(setIdeas).catch(() => setError('No se pudieron cargar las ideas'));
  const cargarIdea = () => (selId ? getIdea(selId).then(i => { setIdea(i); setForm(i); }).catch(() => setIdea(null)) : Promise.resolve());
  useEffect(() => {
    cargar();
    getLeads().then(setLeads).catch(() => {});
    if (rol === 'admin') getClientes().then(setClientes).catch(() => {});
  }, []);
  useEffect(() => { cargarIdea(); }, [selId]);

  const intenta = async (fn) => {
    setError('');
    try { await fn(); await Promise.all([cargar(), cargarIdea()]); return true; }
    catch (e) { setError(e.response?.data?.error || 'Ocurrió un error'); return false; }
  };

  async function crear(e) {
    e.preventDefault();
    let creada;
    if (await intenta(async () => { creada = await createIdea(nueva); })) { setNueva(null); setParams({ id: creada.id }); }
  }

  function guardar(e) {
    e.preventDefault();
    const { titulo, descripcion, existe_en, estado } = form;
    if (estado === 'catalogo' && idea.estado !== 'catalogo' && !idea.modulo_id &&
        !window.confirm(`Se creará "${titulo}" en el Catálogo como "sin empaquetar". ¿Continuar?`)) return;
    intenta(() => updateIdea(idea.id, { titulo, descripcion: descripcion || '', existe_en: existe_en || '', estado }));
  }

  async function borrar() {
    if (!window.confirm(`¿Borrar la idea "${idea.titulo}" con sus ${idea.solicitudes.length} solicitudes?`)) return;
    if (await intenta(() => deleteIdea(idea.id))) setParams({});
  }

  async function agregarSolicitud(e) {
    e.preventDefault();
    const [tipo, id] = sol.quien.split(':');
    if (await intenta(() => addSolicitud(idea.id, { [`${tipo}_id`]: id, nota: sol.nota }))) setSol({ quien: '', nota: '' });
  }

  const visibles = ideas.filter(i => (filtro === 'abiertas' ? ABIERTAS.includes(i.estado) : filtro === 'todas' || i.estado === filtro));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold">Ideas de módulos</h1>
        <button onClick={() => setNueva({ titulo: '', descripcion: '', existe_en: '' })}
                className={`${boton} ml-auto flex items-center gap-1`} style={acento}><Plus className="w-4 h-4" /> Idea</button>
      </div>
      <p className="text-sm opacity-60 mb-4">Lo que piden leads y clientes. Se anota desde su ficha o aquí; lo más pedido va arriba.</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {[['abiertas', 'Abiertas'], ...ESTADOS_IDEA.map(e => [e.key, e.label]), ['todas', 'Todas']].map(([k, l]) => (
          <button key={k} onClick={() => setFiltro(k)}
                  className={`text-xs px-3 py-1 rounded-full border ${filtro === k ? 'bg-black text-white font-semibold' : 'opacity-70'}`} style={borde}>
            {l}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {nueva && (
        <form onSubmit={crear} className="bg-white border rounded-xl p-4 mb-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]" style={borde}>
          <input className={input} required maxLength={150} placeholder="Título (ej. Facturación CFDI)" value={nueva.titulo}
                 onChange={e => setNueva({ ...nueva, titulo: e.target.value })} />
          <input className={input} maxLength={150} placeholder="¿Ya existe en algún proyecto? (ej. Gioval)" value={nueva.existe_en}
                 onChange={e => setNueva({ ...nueva, existe_en: e.target.value })} />
          <div className="flex gap-2">
            <button className={boton} style={acento}>Crear</button>
            <button type="button" onClick={() => setNueva(null)} className="rounded-lg px-4 py-2 text-sm border" style={borde}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_26rem]">
        <div className="space-y-2">
          {visibles.length === 0 && <p className="text-sm opacity-60">No hay ideas aquí.</p>}
          {visibles.map(i => (
            <button key={i.id} onClick={() => setParams({ id: i.id })}
                    className={`w-full text-left bg-white border rounded-xl p-4 flex gap-4 items-center hover:brightness-110 ${String(i.id) === selId ? 'ring-2 ring-violet-400' : ''}`}
                    style={borde}>
              <div className="w-12 text-center shrink-0">
                <div className="text-2xl font-bold font-mono">{i.num_solicitudes}</div>
                <div className="text-[10px] opacity-60">la piden</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{i.titulo}</div>
                <div className="text-xs opacity-60 truncate">{i.quienes || 'Sin solicitudes'}</div>
                {i.existe_en && <div className="text-xs mt-0.5" style={{ color: 'var(--color-violet)' }}>Ya existe en {i.existe_en}</div>}
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full shrink-0 text-black" style={{ backgroundColor: estadoIdea(i.estado).color }}>
                {estadoIdea(i.estado).label}
              </span>
            </button>
          ))}
        </div>

        {idea && form && String(idea.id) === selId && (
          <div className="bg-white border rounded-xl p-5 self-start space-y-4" style={borde}>
            <form onSubmit={guardar} className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium opacity-70">Título</span>
                <input className={input} required maxLength={150} value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-medium opacity-70">Descripción</span>
                <textarea className={input} rows={3} value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-medium opacity-70">Ya existe en (proyecto)</span>
                <input className={input} maxLength={150} value={form.existe_en || ''} onChange={e => setForm({ ...form, existe_en: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-medium opacity-70">Estado</span>
                <select className={input} value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                  {ESTADOS_IDEA.filter(s => s.key !== 'catalogo' || rol === 'admin' || idea.estado === 'catalogo')
                    .map(s => <option key={s.key} value={s.key}>{s.key === 'catalogo' ? 'Pasa al catálogo' : s.label}</option>)}
                </select>
              </label>
              {idea.modulo_id && (
                <p className="text-xs">En catálogo como <Link to="/catalogo" className="underline">{idea.modulo_nombre}</Link></p>
              )}
              <div className="flex gap-2">
                <button className={boton} style={acento}>Guardar</button>
                <button type="button" onClick={() => setParams({})} className="rounded-lg px-4 py-2 text-sm border" style={borde}>Cerrar</button>
                {rol === 'admin' && <button type="button" onClick={borrar} className="ml-auto text-sm text-red-500 hover:underline">Borrar</button>}
              </div>
            </form>

            <div>
              <h3 className="font-semibold text-sm mb-2">La piden ({idea.solicitudes.length})</h3>
              <ul className="space-y-2 mb-3">
                {idea.solicitudes.map(s => (
                  <li key={s.id} className="text-sm border-l-2 pl-3" style={borde}>
                    <div className="flex items-center gap-2">
                      {s.lead_id ? <Link to={`/leads/${s.lead_id}`} className="font-medium hover:underline">{s.lead_nombre}</Link>
                        : s.cliente_id ? (rol === 'admin' ? <Link to={`/clientes/${s.cliente_id}`} className="font-medium hover:underline">{s.cliente_nombre}</Link>
                          : <span className="font-medium">{s.cliente_nombre}</span>)
                        : <span className="font-medium opacity-60">Sin lead/cliente</span>}
                      <span className="text-xs opacity-50">{fechaCorta(s.created_at)}{s.anoto ? ` · ${s.anoto}` : ''}</span>
                      <button onClick={() => window.confirm('¿Quitar esta solicitud?') && intenta(() => deleteSolicitud(idea.id, s.id))}
                              className="ml-auto opacity-40 hover:opacity-100" aria-label="Quitar solicitud"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    {s.nota && <p className="text-xs opacity-70 mt-0.5 whitespace-pre-line">“{s.nota}”</p>}
                  </li>
                ))}
              </ul>
              <form onSubmit={agregarSolicitud} className="space-y-2">
                <select className={input} required value={sol.quien} onChange={e => setSol({ ...sol, quien: e.target.value })}>
                  <option value="" disabled>¿Quién más la pidió?</option>
                  <optgroup label="Leads">{leads.map(l => <option key={l.id} value={`lead:${l.id}`}>{l.nombre}</option>)}</optgroup>
                  {clientes.length > 0 && <optgroup label="Clientes">{clientes.map(c => <option key={c.id} value={`cliente:${c.id}`}>{c.nombre}</option>)}</optgroup>}
                </select>
                <input className={input} placeholder="Nota (opcional)" value={sol.nota} onChange={e => setSol({ ...sol, nota: e.target.value })} />
                <button className="text-sm px-3 py-1.5 rounded-lg border" style={borde}>+ Agregar solicitud</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
