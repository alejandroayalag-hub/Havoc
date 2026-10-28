import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MessageCircle, Printer, Trash2 } from 'lucide-react';
import {
  getLead, updateLead, deleteLead, getModulos, createCotizacion, deleteCotizacion, getMateriales,
  ETAPAS, etapa, dinero,
} from '../api/ventas';
import { clienteDesdeLead } from '../api/clientes';
import logo from '../assets/havoc-wordmark.svg';
import MaterialCard from '../components/MaterialCard';

const input = 'w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300';
const CAMPOS = [
  ['nombre', 'Nombre'], ['telefono', 'Teléfono'], ['empresa', 'Empresa'], ['recomendado_por', 'Lo recomendó'],
];

const folio = (id) => `COT-${String(id).padStart(4, '0')}`;
const totales = (items) => items.reduce((t, i) => ({
  desarrollo: t.desarrollo + Number(i.precio_desarrollo || 0),
  mensualidad: t.mensualidad + Number(i.mensualidad || 0),
}), { desarrollo: 0, mensualidad: 0 });

// wa.me necesita lada de país; los números de 10 dígitos son de México
const whatsapp = (tel) => {
  const d = (tel || '').replace(/\D/g, '');
  return d.length === 10 ? `https://wa.me/52${d}` : d ? `https://wa.me/${d}` : null;
};

export default function LeadDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rol = localStorage.getItem('rol');
  const [lead, setLead] = useState(null);
  const [form, setForm] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [lineas, setLineas] = useState(null); // null = cotizador cerrado
  const [notasCot, setNotasCot] = useState('');
  const [imprimir, setImprimir] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = () => getLead(id).then(l => { setLead(l); setForm(l); })
    .catch(e => setError(e.response?.data?.error || 'No se pudo cargar'));
  useEffect(() => { cargar(); getModulos().then(setModulos).catch(() => {}); getMateriales().then(setMateriales).catch(() => {}); }, [id]);

  useEffect(() => {
    if (!imprimir) return;
    const fin = () => setImprimir(null);
    window.addEventListener('afterprint', fin, { once: true });
    window.print();
    return () => window.removeEventListener('afterprint', fin);
  }, [imprimir]);

  const fallo = (e) => setError(e.response?.data?.error || 'Ocurrió un error');

  async function guardar(e) {
    e?.preventDefault();
    setError(''); setAviso('');
    if (form.etapa === 'perdido' && !form.motivo_perdida?.trim()) return setError('Anota el motivo por el que se perdió');
    try {
      const datos = Object.fromEntries(['nombre', 'telefono', 'empresa', 'recomendado_por', 'necesidad', 'etapa', 'motivo_perdida', 'notas']
        .map(k => [k, form[k] ?? null]));
      await updateLead(id, datos);
      await cargar();
      setAviso('Guardado');
    } catch (err) { fallo(err); }
  }

  async function borrar() {
    if (!window.confirm(`¿Borrar el lead ${lead.nombre} y sus cotizaciones?`)) return;
    try { await deleteLead(id); navigate('/leads'); } catch (err) { fallo(err); }
  }

  function agregarModulo(moduloId) {
    const m = modulos.find(x => String(x.id) === moduloId);
    if (!m) return;
    setLineas([...lineas, {
      modulo_id: m.id, concepto: m.nombre,
      precio_desarrollo: m.precio_desarrollo ?? '', mensualidad: m.mensualidad ?? '',
    }]);
  }
  const setLinea = (i, k, v) => setLineas(lineas.map((l, j) => (j === i ? { ...l, [k]: v } : l)));

  async function guardarCotizacion() {
    setError('');
    if (!lineas.length) return setError('Agrega al menos un concepto');
    try {
      await createCotizacion(id, { notas: notasCot, items: lineas });
      setLineas(null); setNotasCot('');
      cargar();
    } catch (err) { fallo(err); }
  }

  async function convertir() {
    const ultima = lead.cotizaciones[0];
    if (!window.confirm(ultima
      ? `¿Convertir en cliente con los sistemas y el cobro de desarrollo de ${folio(ultima.id)}?`
      : '¿Convertir en cliente? No tiene cotización: se crea sin sistemas.')) return;
    setError('');
    try { const c = await clienteDesdeLead(id); navigate(`/clientes/${c.id}`); } catch (err) { fallo(err); }
  }

  async function borrarCotizacion(c) {
    if (!window.confirm(`¿Borrar ${folio(c.id)}?`)) return;
    try { await deleteCotizacion(id, c.id); cargar(); } catch (err) { fallo(err); }
  }

  if (!lead) return <p className="opacity-60">{error || 'Cargando…'}</p>;
  const wa = whatsapp(lead.telefono);
  const t = lineas && totales(lineas);
  // Material general + el de los módulos que se le cotizaron (todo si aún no hay cotización)
  const cotizados = new Set(lead.cotizaciones.flatMap(c => c.items.map(i => i.modulo_id)).filter(Boolean));
  const material = materiales.filter(m => !m.modulo_id || !cotizados.size || cotizados.has(m.modulo_id));

  return (
    <div>
      <div className="print:hidden">
        <Link to="/leads" className="text-sm opacity-60 hover:opacity-100">← Leads</Link>
        <div className="flex flex-wrap items-center gap-3 mt-2 mb-6">
          <h1 className="text-2xl font-bold">{lead.nombre}</h1>
          <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: etapa(lead.etapa).color }}>
            {etapa(lead.etapa).label}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
          {rol === 'admin' && (lead.cliente_id
            ? <Link to={`/clientes/${lead.cliente_id}`} className="text-sm px-3 py-1.5 rounded-lg border bg-white" style={{ borderColor: 'var(--color-sage)' }}>Ver cliente →</Link>
            : lead.etapa !== 'perdido' && (
              <button onClick={convertir} className="text-sm px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: '#15803D' }}>
                Ganado → convertir en cliente
              </button>))}
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer"
               className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border bg-white"
               style={{ borderColor: 'var(--color-sage)' }}>
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          )}
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
          {/* Datos del lead */}
          <form onSubmit={guardar} className="bg-white border rounded-xl p-5 space-y-3 self-start" style={{ borderColor: 'var(--color-sage)' }}>
            {CAMPOS.map(([k, label]) => (
              <label key={k} className="block">
                <span className="text-xs font-medium opacity-70">{label}</span>
                <input className={input} value={form[k] || ''} required={k === 'nombre'}
                       onChange={e => setForm({ ...form, [k]: e.target.value })} />
              </label>
            ))}
            <label className="block">
              <span className="text-xs font-medium opacity-70">Qué necesita</span>
              <textarea className={input} rows={3} value={form.necesidad || ''}
                        onChange={e => setForm({ ...form, necesidad: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-xs font-medium opacity-70">Etapa</span>
              <select className={input} value={form.etapa} onChange={e => setForm({ ...form, etapa: e.target.value })}>
                {ETAPAS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
              </select>
            </label>
            {form.etapa === 'perdido' && (
              <label className="block">
                <span className="text-xs font-medium opacity-70">Motivo por el que se perdió *</span>
                <input className={input} value={form.motivo_perdida || ''}
                       onChange={e => setForm({ ...form, motivo_perdida: e.target.value })} />
              </label>
            )}
            <label className="block">
              <span className="text-xs font-medium opacity-70">Notas</span>
              <textarea className={input} rows={4} value={form.notas || ''}
                        onChange={e => setForm({ ...form, notas: e.target.value })} />
            </label>
            <div className="flex items-center gap-3 pt-1">
              <button className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-accent)' }}>
                Guardar
              </button>
              {aviso && <span className="text-xs text-green-700">{aviso}</span>}
              {rol === 'admin' && (
                <button type="button" onClick={borrar} className="ml-auto text-xs text-red-600 hover:underline">Borrar lead</button>
              )}
            </div>
            <p className="text-xs opacity-50">
              Alta {new Date(lead.created_at).toLocaleDateString('es-MX')}{lead.creado_por_nombre ? ` por ${lead.creado_por_nombre}` : ''}
            </p>
          </form>

          {/* Cotizaciones */}
          <div>
            <div className="flex items-center mb-3">
              <h2 className="text-lg font-semibold">Cotizaciones</h2>
              {!lineas && (
                <button onClick={() => setLineas([])}
                        className="ml-auto rounded-lg px-4 py-2 text-sm font-medium text-white"
                        style={{ backgroundColor: 'var(--color-accent)' }}>
                  + Nueva cotización
                </button>
              )}
            </div>

            {lineas && (
              <div className="bg-white border-2 rounded-xl p-5 mb-5" style={{ borderColor: 'var(--color-violet)' }}>
                <div className="flex flex-wrap gap-2 mb-4">
                  <select className={`${input} md:w-72`} value="" onChange={e => agregarModulo(e.target.value)}>
                    <option value="">Agregar módulo del catálogo…</option>
                    {modulos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                  <button type="button" onClick={() => setLineas([...lineas, { modulo_id: null, concepto: '', precio_desarrollo: '', mensualidad: '' }])}
                          className="text-sm px-3 py-2 rounded-lg border" style={{ borderColor: 'var(--color-sage)' }}>
                    + Línea libre
                  </button>
                </div>

                {lineas.length > 0 && (
                  <table className="w-full text-sm mb-3">
                    <thead>
                      <tr className="text-xs opacity-60 text-left">
                        <th className="py-1">Concepto</th><th className="py-1 w-36">Desarrollo</th><th className="py-1 w-36">Mensualidad</th><th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {lineas.map((l, i) => (
                        <tr key={i}>
                          <td className="py-1 pr-2"><input className={input} value={l.concepto} onChange={e => setLinea(i, 'concepto', e.target.value)} /></td>
                          <td className="py-1 pr-2"><input className={`${input} font-mono`} type="number" min="0" step="0.01" value={l.precio_desarrollo} onChange={e => setLinea(i, 'precio_desarrollo', e.target.value)} /></td>
                          <td className="py-1 pr-2"><input className={`${input} font-mono`} type="number" min="0" step="0.01" value={l.mensualidad} onChange={e => setLinea(i, 'mensualidad', e.target.value)} /></td>
                          <td><button type="button" onClick={() => setLineas(lineas.filter((_, j) => j !== i))} aria-label="Quitar línea">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button></td>
                        </tr>
                      ))}
                      <tr className="font-semibold border-t" style={{ borderColor: 'var(--color-sage)' }}>
                        <td className="py-2">Total</td>
                        <td className="py-2 font-mono">{dinero(t.desarrollo)}</td>
                        <td className="py-2 font-mono">{dinero(t.mensualidad)}/mes</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                )}

                <textarea className={input} rows={2} placeholder="Notas para el cliente (alcance, tiempos de pago, lo que incluye)"
                          value={notasCot} onChange={e => setNotasCot(e.target.value)} />
                <div className="flex gap-2 mt-3">
                  <button onClick={guardarCotizacion} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-accent)' }}>
                    Guardar cotización
                  </button>
                  <button onClick={() => { setLineas(null); setNotasCot(''); }} className="text-sm px-3 py-2 opacity-70">Cancelar</button>
                </div>
              </div>
            )}

            {lead.cotizaciones.map(c => {
              const tc = totales(c.items);
              return (
                <div key={c.id} className="bg-white border rounded-xl p-4 mb-3" style={{ borderColor: 'var(--color-sage)' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm font-medium">{folio(c.id)}</span>
                    <span className="text-xs opacity-60">{new Date(c.created_at).toLocaleDateString('es-MX')}</span>
                    <button onClick={() => setImprimir(c)} className="ml-auto flex items-center gap-1 text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--color-sage)' }}>
                      <Printer className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button onClick={() => borrarCotizacion(c)} aria-label="Borrar cotización"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                  <ul className="text-sm space-y-0.5">
                    {c.items.map(i => (
                      <li key={i.id} className="flex gap-2">
                        <span className="flex-1">{i.concepto}</span>
                        <span className="font-mono">{dinero(i.precio_desarrollo)}</span>
                        <span className="font-mono w-32 text-right opacity-70">{dinero(i.mensualidad)}/mes</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2 text-sm font-semibold border-t mt-2 pt-2" style={{ borderColor: 'var(--color-sage)' }}>
                    <span className="flex-1">Total</span>
                    <span className="font-mono">{dinero(tc.desarrollo)}</span>
                    <span className="font-mono w-32 text-right">{dinero(tc.mensualidad)}/mes</span>
                  </div>
                </div>
              );
            })}
            {!lead.cotizaciones.length && !lineas && <p className="text-sm opacity-50">Aún no hay cotizaciones.</p>}

            <h2 className="text-lg font-semibold mt-8 mb-1">Material para enviar</h2>
            <p className="text-xs opacity-60 mb-3">
              {cotizados.size ? 'Material general y el de los módulos que se le cotizaron.' : 'Todo el material; al cotizar se filtra a sus módulos.'}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {material.map(m => <MaterialCard key={m.id} m={m} whatsapp={wa} />)}
              {!material.length && <p className="text-sm opacity-50">No hay material ligado a estos módulos.</p>}
            </div>
          </div>
        </div>
      </div>

      {imprimir && <CotizacionImpresa lead={lead} c={imprimir} />}
    </div>
  );
}

// Hoja que sale al imprimir / guardar como PDF desde el navegador
function CotizacionImpresa({ lead, c }) {
  const t = totales(c.items);
  return (
    <div className="print-area hidden print:block p-10 text-[#1E1533]">
      <div className="flex items-start justify-between mb-10">
        <img src={logo} alt="HAVOC · Soluciones Integradas" className="h-16" />
        <div className="text-right">
          <p className="font-display text-2xl font-bold">Cotización</p>
          <p className="font-mono text-sm">{folio(c.id)}</p>
          <p className="text-sm">{new Date(c.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <p className="text-xs uppercase tracking-widest opacity-60">Para</p>
      <p className="text-lg font-semibold">{lead.nombre}</p>
      {lead.empresa && <p>{lead.empresa}</p>}

      <table className="w-full text-sm mt-8">
        <thead>
          <tr className="border-b-2 border-[#1E1533] text-left">
            <th className="py-2">Concepto</th>
            <th className="py-2 text-right">Desarrollo (pago único)</th>
            <th className="py-2 text-right">Mensualidad</th>
          </tr>
        </thead>
        <tbody>
          {c.items.map(i => (
            <tr key={i.id} className="border-b border-gray-200">
              <td className="py-2">{i.concepto}</td>
              <td className="py-2 text-right font-mono">{dinero(i.precio_desarrollo)}</td>
              <td className="py-2 text-right font-mono">{dinero(i.mensualidad)}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="py-3">Total</td>
            <td className="py-3 text-right font-mono">{dinero(t.desarrollo)}</td>
            <td className="py-3 text-right font-mono">{dinero(t.mensualidad)}</td>
          </tr>
        </tbody>
      </table>

      <p className="text-xs mt-4 opacity-70">
        La mensualidad cubre hosting y mantenimiento de sus datos en el servidor.
      </p>
      {c.notas && <p className="mt-6 text-sm whitespace-pre-line">{c.notas}</p>}

      <p className="mt-16 text-xs font-mono opacity-60">havocdev.mx · ventas@havocdev.mx</p>
    </div>
  );
}
