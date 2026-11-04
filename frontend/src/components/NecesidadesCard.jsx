// "Necesidades" en la ficha de un lead o cliente: lo que pidió se anota como solicitud de una Idea (nueva o existente).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getIdeas, createIdea, addSolicitud, estadoIdea } from '../api/ideas';

const input = 'w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300';
const borde = { borderColor: 'var(--color-sage)' };

export default function NecesidadesCard({ leadId, clienteId }) {
  const filtro = leadId ? { lead_id: leadId } : { cliente_id: clienteId };
  const [suyas, setSuyas] = useState([]);
  const [todas, setTodas] = useState([]);
  const [form, setForm] = useState(null);  // { idea_id: '' | id | 'nueva', titulo, nota }
  const [error, setError] = useState('');

  const cargar = () => Promise.all([getIdeas(filtro), getIdeas()])
    .then(([s, t]) => { setSuyas(s); setTodas(t); }).catch(() => setError('No se pudieron cargar las ideas'));
  useEffect(() => { cargar(); }, [leadId, clienteId]);

  async function guardar(e) {
    e.preventDefault();
    setError('');
    const solicitud = { ...filtro, nota: form.nota };
    try {
      if (form.idea_id === 'nueva') await createIdea({ titulo: form.titulo, solicitud });
      else await addSolicitud(form.idea_id, solicitud);
      setForm(null); cargar();
    } catch (err) { setError(err.response?.data?.error || 'No se pudo guardar'); }
  }

  return (
    <div className="bg-white border rounded-xl p-5 mt-6" style={borde}>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold">Necesidades</h2>
        <span className="text-xs opacity-60">van a Ideas de módulos</span>
        {!form && <button onClick={() => setForm({ idea_id: '', titulo: '', nota: '' })}
                          className="ml-auto text-sm px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: 'var(--color-accent)' }}>
          Anotar necesidad</button>}
      </div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      {form && (
        <form onSubmit={guardar} className="space-y-2 mb-4">
          <select className={input} required value={form.idea_id} onChange={e => setForm({ ...form, idea_id: e.target.value })}>
            <option value="" disabled>¿Qué necesita?</option>
            <option value="nueva">+ Idea nueva…</option>
            {todas.map(i => <option key={i.id} value={i.id}>{i.titulo} ({i.num_solicitudes})</option>)}
          </select>
          {form.idea_id === 'nueva' && (
            <input className={input} required maxLength={150} placeholder="Ej. Punto de venta, Facturación CFDI…"
                   value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
          )}
          <textarea className={input} rows={2} placeholder="Lo que dijo, en sus palabras (opcional)"
                    value={form.nota} onChange={e => setForm({ ...form, nota: e.target.value })} />
          <div className="flex gap-2">
            <button className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-accent)' }}>Guardar</button>
            <button type="button" onClick={() => setForm(null)} className="rounded-lg px-4 py-2 text-sm border" style={borde}>Cancelar</button>
          </div>
        </form>
      )}

      {suyas.length === 0 ? <p className="text-sm opacity-60">Sin necesidades anotadas.</p> : (
        <ul className="space-y-1.5">
          {suyas.map(i => (
            <li key={i.id} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: estadoIdea(i.estado).color }} />
              <Link to={`/ideas?id=${i.id}`} className="hover:underline">{i.titulo}</Link>
              <span className="text-xs opacity-60">{estadoIdea(i.estado).label} · {i.num_solicitudes} la piden</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
