import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getLeads, createLead, ETAPAS, etapa } from '../api/ventas';

const input = 'min-w-0 border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300';

export default function LeadsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filtro = params.get('etapa') || '';
  const [leads, setLeads] = useState([]);
  const [q, setQ] = useState('');
  const [nuevo, setNuevo] = useState({ nombre: '', telefono: '', necesidad: '' });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = () => getLeads().then(setLeads).catch(e => setError(e.response?.data?.error || 'No se pudieron cargar los leads'));
  useEffect(() => { cargar(); }, []);

  // Alta rápida: nombre + teléfono + qué necesita, nada más
  async function agregar(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await createLead(nuevo);
      setNuevo({ nombre: '', telefono: '', necesidad: '' });
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  const texto = q.trim().toLowerCase();
  const visibles = leads.filter(l =>
    (!filtro || l.etapa === filtro) &&
    (!texto || [l.nombre, l.empresa, l.telefono, l.necesidad].some(v => v?.toLowerCase().includes(texto))));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Leads de venta</h1>

      <form onSubmit={agregar} className="bg-white border rounded-xl p-4 mb-6 grid gap-2 md:grid-cols-[1fr_10rem_2fr_auto]"
            style={{ borderColor: 'var(--color-sage)' }}>
        <input className={input} placeholder="Nombre *" required value={nuevo.nombre}
               onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })} />
        <input className={input} placeholder="Teléfono" type="tel" value={nuevo.telefono}
               onChange={e => setNuevo({ ...nuevo, telefono: e.target.value })} />
        <input className={input} placeholder="¿Qué necesita?" value={nuevo.necesidad}
               onChange={e => setNuevo({ ...nuevo, necesidad: e.target.value })} />
        <button disabled={guardando} className="rounded-lg px-4 py-2 text-sm font-medium text-white whitespace-nowrap disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-accent)' }}>
          + Agregar
        </button>
        {error && <p className="text-sm text-red-600 md:col-span-4">{error}</p>}
      </form>

      {/* Contadores por etapa: clic filtra, segundo clic quita el filtro */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {ETAPAS.map(e => {
          const activo = filtro === e.key;
          return (
            <button key={e.key} onClick={() => setParams(activo ? {} : { etapa: e.key })}
                    className="text-left bg-white rounded-xl border-2 p-4 hover:shadow-md transition-shadow"
                    style={{ borderColor: activo ? e.color : 'var(--color-sage)' }}>
              <p className="font-mono text-3xl" style={{ color: e.color }}>{leads.filter(l => l.etapa === e.key).length}</p>
              <p className="text-xs mt-1 opacity-70">{e.label}</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {filtro && (
          <button onClick={() => setParams({})} className="text-xs px-3 py-1.5 rounded-full border bg-white"
                  style={{ borderColor: 'var(--color-sage)' }}>
            {etapa(filtro).label} ✕
          </button>
        )}
        <input className={`${input} ml-auto w-full md:w-64`} placeholder="Buscar…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="bg-white border rounded-xl overflow-x-auto" style={{ borderColor: 'var(--color-sage)' }}>
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: 'var(--color-primary)' }}>
            <tr>
              {['Nombre', 'Teléfono', 'Qué necesita', 'Etapa', 'Actualizado'].map(h => (
                <th key={h} className="text-left px-4 py-2 text-xs font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map(l => (
              <tr key={l.id} onClick={() => navigate(`/leads/${l.id}`)}
                  className="border-t cursor-pointer hover:bg-violet-50" style={{ borderColor: 'var(--color-sage)' }}>
                <td className="px-4 py-2">
                  <Link to={`/leads/${l.id}`} className="font-medium">{l.nombre}</Link>
                  {l.empresa && <span className="block text-xs opacity-60">{l.empresa}</span>}
                </td>
                <td className="px-4 py-2 font-mono text-xs">{l.telefono || '—'}</td>
                <td className="px-4 py-2 max-w-md truncate opacity-80">{l.necesidad || '—'}</td>
                <td className="px-4 py-2">
                  <span className="text-xs px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                        style={{ backgroundColor: etapa(l.etapa).color }}>{etapa(l.etapa).label}</span>
                </td>
                <td className="px-4 py-2 font-mono text-xs opacity-60">{new Date(l.updated_at).toLocaleDateString('es-MX')}</td>
              </tr>
            ))}
            {!visibles.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center opacity-50">Sin leads</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
