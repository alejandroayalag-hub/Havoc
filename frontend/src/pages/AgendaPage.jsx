import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { getAgenda, createEvento, updateEvento, deleteEvento, TIPOS_EVENTO } from '../api/agenda';
import { getLeads, dinero } from '../api/ventas';
import { getClientes } from '../api/clientes';

const input = 'w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300';
const borde = { borderColor: 'var(--color-sage)' };
const boton = 'rounded-lg px-4 py-2 text-sm font-medium text-white';
const acento = { backgroundColor: 'var(--color-accent)' };

// Colores fijos (no pasan por el remapeo de grises/azules del tema)
const COLOR = { reunion: '#A78BFA', entrega: '#34D399', capacitacion: '#38BDF8', cobro: '#FBBF24', externo: '#8E84A8' };
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const clave = (d) => d.toLocaleDateString('en-CA');  // YYYY-MM-DD local
const sumaDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const lunes = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return sumaDias(x, -((x.getDay() + 6) % 7)); };
const hora = (d) => d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
// datetime-local trabaja en hora local sin zona
const aLocal = (d) => { const x = new Date(d); return new Date(x - x.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

function rango(vista, ref) {
  if (vista === 'semana') { const ini = lunes(ref); return [ini, sumaDias(ini, 7)]; }
  const ini = lunes(new Date(ref.getFullYear(), ref.getMonth(), 1));
  return [ini, sumaDias(ini, 42)];
}

export default function AgendaPage() {
  const rol = localStorage.getItem('rol');
  const [params, setParams] = useSearchParams();
  const [vista, setVista] = useState(window.innerWidth < 768 ? 'semana' : 'mes');
  const [ref, setRef] = useState(new Date());
  const [datos, setDatos] = useState({ eventos: [], cobros: [], externos: [], caldav: 'apagado' });
  const [leads, setLeads] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const [desde, hasta] = useMemo(() => rango(vista, ref), [vista, ref]);
  const cargar = () => getAgenda(desde.toISOString(), hasta.toISOString()).then(setDatos)
    .catch(e => setError(e.response?.data?.error || 'No se pudo cargar la agenda'));
  useEffect(() => { cargar(); }, [desde, hasta]);

  useEffect(() => {
    getLeads().then(setLeads).catch(() => {});
    if (rol === 'admin') getClientes().then(setClientes).catch(() => {});
  }, []);

  // ?lead=ID o ?cliente=ID abre un evento nuevo ya ligado (botón "Agendar" de las fichas)
  useEffect(() => {
    const lead = leads.find(l => String(l.id) === params.get('lead'));
    const cliente = clientes.find(c => String(c.id) === params.get('cliente'));
    if (!lead && !cliente) return;
    nuevo(new Date(), {
      lead_id: lead?.id ?? '', cliente_id: cliente?.id ?? '',
      titulo: lead ? `Reunión con ${lead.nombre}` : `Reunión con ${cliente.nombre}`,
    });
    setParams({}, { replace: true });
  }, [leads, clientes]);

  function nuevo(dia, extra = {}) {
    const ini = new Date(dia); ini.setHours(10, 0, 0, 0);
    setForm({ tipo: 'reunion', titulo: '', inicio: aLocal(ini), fin: aLocal(new Date(+ini + 3600e3)),
              lead_id: '', cliente_id: '', notas: '', ...extra });
  }

  const editar = (ev) => setForm({ ...ev, inicio: aLocal(ev.inicio), fin: aLocal(ev.fin),
                                   lead_id: ev.lead_id ?? '', cliente_id: ev.cliente_id ?? '', notas: ev.notas ?? '' });

  async function guardar(e) {
    e.preventDefault();
    setError(''); setAviso('');
    const { id, tipo, titulo, inicio, fin, lead_id, cliente_id, notas } = form;
    const datosEv = { tipo, titulo, inicio: new Date(inicio).toISOString(), fin: new Date(fin).toISOString(), lead_id, cliente_id, notas };
    try {
      const r = await (id ? updateEvento(id, datosEv) : createEvento(datosEv));
      if (r.caldav === 'error') setAviso('Guardado, pero no se pudo copiar al calendario de ventas@. Se reintenta al editarlo.');
      setForm(null); cargar();
    } catch (err) { setError(err.response?.data?.error || 'No se pudo guardar'); }
  }

  async function borrar() {
    if (!window.confirm(`¿Borrar "${form.titulo}"?`)) return;
    try { await deleteEvento(form.id); setForm(null); cargar(); }
    catch (err) { setError(err.response?.data?.error || 'No se pudo borrar'); }
  }

  // Todo lo del rango, agrupado por día
  const porDia = useMemo(() => {
    const m = {};
    const add = (k, it) => (m[k] ||= []).push(it);
    datos.eventos.forEach(ev => add(clave(new Date(ev.inicio)), {
      key: `e${ev.id}`, tipo: ev.tipo, inicio: new Date(ev.inicio), titulo: ev.titulo,
      sub: ev.lead_nombre || ev.cliente_nombre, ev,
    }));
    datos.externos.forEach((ev, i) => add(clave(new Date(ev.inicio)), {
      key: `x${i}`, tipo: 'externo', inicio: new Date(ev.inicio), titulo: ev.titulo, sub: 'Calendario ventas@',
    }));
    datos.cobros.forEach(c => add(String(c.vence).slice(0, 10), {
      key: `c${c.id}`, tipo: 'cobro', titulo: `Cobro ${dinero(c.monto)}`, sub: `${c.cliente_nombre} · ${c.concepto}`,
      link: `/clientes/${c.cliente_id}`,
    }));
    Object.values(m).forEach(l => l.sort((a, b) => (a.inicio ?? 0) - (b.inicio ?? 0)));
    return m;
  }, [datos]);

  const mover = (n) => setRef(vista === 'mes' ? new Date(ref.getFullYear(), ref.getMonth() + n, 1) : sumaDias(ref, 7 * n));
  const titulo = vista === 'mes'
    ? ref.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    : `${desde.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} – ${sumaDias(hasta, -1).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  const hoy = clave(new Date());
  const dias = Array.from({ length: (hasta - desde) / 864e5 | 0 }, (_, i) => sumaDias(desde, i));

  const Item = ({ it, compacto }) => {
    const cuerpo = (
      <span className="block truncate">
        {it.inicio && <span className="font-mono opacity-70 mr-1">{hora(it.inicio)}</span>}
        {it.titulo}
        {!compacto && it.sub && <span className="block text-xs opacity-60 truncate">{it.sub}</span>}
      </span>
    );
    const cls = `block w-full text-left rounded px-1.5 py-0.5 ${compacto ? 'text-[11px]' : 'text-sm py-1.5 px-2'} hover:brightness-125`;
    const estilo = { borderLeft: `3px solid ${COLOR[it.tipo]}`, backgroundColor: 'var(--color-primary)' };
    if (it.ev) return <button type="button" className={cls} style={estilo} onClick={(e) => { e.stopPropagation(); editar(it.ev); }}>{cuerpo}</button>;
    if (it.link) return <Link to={it.link} className={cls} style={estilo} onClick={e => e.stopPropagation()}>{cuerpo}</Link>;
    return <div className={cls} style={estilo} title="Evento del calendario de ventas@ (se edita allá)">{cuerpo}</div>;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold mr-2">Agenda</h1>
        <div className="flex items-center gap-1">
          <button onClick={() => mover(-1)} className="p-1.5 rounded hover:bg-zinc-200" aria-label="Anterior"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={() => setRef(new Date())} className="text-sm px-2 py-1 border rounded" style={borde}>Hoy</button>
          <button onClick={() => mover(1)} className="p-1.5 rounded hover:bg-zinc-200" aria-label="Siguiente"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <span className="font-semibold inline-block first-letter:uppercase">{titulo}</span>
        <div className="flex border rounded-lg overflow-hidden ml-auto" style={borde}>
          {['mes', 'semana'].map(v => (
            <button key={v} onClick={() => setVista(v)}
                    className={`text-sm px-3 py-1.5 capitalize ${vista === v ? 'font-semibold bg-black text-white' : 'opacity-70'}`}>{v}</button>
          ))}
        </div>
        <button onClick={() => nuevo(ref)} className={`${boton} flex items-center gap-1`} style={acento}>
          <Plus className="w-4 h-4" /> Evento
        </button>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-80 mb-3">
        {[...Object.entries(TIPOS_EVENTO), ...(rol === 'admin' ? [['cobro', 'Cobro pendiente']] : []), ['externo', 'Calendario ventas@']]
          .map(([k, l]) => <span key={k} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR[k] }} />{l}</span>)}
        {datos.caldav === 'error' && <span className="text-amber-400">No se pudo leer el calendario de ventas@</span>}
        {datos.caldav === 'apagado' && <span className="opacity-60">Sincronización con calendario apagada</span>}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {aviso && <p className="mb-3 text-sm text-amber-400">{aviso}</p>}

      {vista === 'mes' ? (
        <div className="grid grid-cols-7 border-l border-t rounded-lg overflow-hidden" style={borde}>
          {DIAS.map(d => <div key={d} className="text-xs font-medium text-center py-1.5 border-r border-b" style={{ ...borde, backgroundColor: 'var(--color-primary)' }}>{d}</div>)}
          {dias.map(d => {
            const items = porDia[clave(d)] || [];
            const fuera = d.getMonth() !== ref.getMonth();
            return (
              <div key={clave(d)} onClick={() => nuevo(d)}
                   className={`min-h-24 p-1 border-r border-b cursor-pointer space-y-0.5 ${fuera ? 'opacity-40' : ''}`} style={borde}>
                <button type="button" onClick={e => { e.stopPropagation(); setRef(d); setVista('semana'); }}
                        className={`text-xs w-6 h-6 rounded-full hover:underline ${clave(d) === hoy ? 'text-white font-bold' : ''}`}
                        style={clave(d) === hoy ? acento : undefined}>{d.getDate()}</button>
                {items.slice(0, 3).map(it => <Item key={it.key} it={it} compacto />)}
                {items.length > 3 && <span className="block text-[11px] opacity-60 px-1">+{items.length - 3} más</span>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {dias.map(d => (
            <div key={clave(d)} className="bg-white border rounded-xl p-3 flex gap-3" style={borde}>
              <div className={`w-14 shrink-0 text-center ${clave(d) === hoy ? 'font-bold' : ''}`}>
                <div className="text-xs opacity-60">{DIAS[(d.getDay() + 6) % 7]}</div>
                <div className="text-xl" style={clave(d) === hoy ? { color: 'var(--color-violet)' } : undefined}>{d.getDate()}</div>
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                {(porDia[clave(d)] || []).map(it => <Item key={it.key} it={it} />)}
                <button onClick={() => nuevo(d)} className="text-xs opacity-50 hover:opacity-100">+ agregar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setForm(null)}>
          <form onSubmit={guardar} onClick={e => e.stopPropagation()}
                className="w-full max-w-md rounded-xl border p-5 space-y-3 max-h-[90vh] overflow-y-auto"
                style={{ ...borde, backgroundColor: 'var(--color-card)' }}>
            <h2 className="font-semibold">{form.id ? 'Editar evento' : 'Nuevo evento'}</h2>
            <label className="block">
              <span className="text-xs font-medium opacity-70">Tipo</span>
              <select className={input} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                {Object.entries(TIPOS_EVENTO).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium opacity-70">Título</span>
              <input className={input} required maxLength={200} value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium opacity-70">Inicio</span>
                <input className={input} type="datetime-local" required value={form.inicio}
                       onChange={e => {
                         // mueve el fin junto con el inicio conservando la duración
                         const dur = new Date(form.fin) - new Date(form.inicio);
                         const fin = e.target.value ? aLocal(new Date(+new Date(e.target.value) + (dur > 0 ? dur : 3600e3))) : form.fin;
                         setForm({ ...form, inicio: e.target.value, fin });
                       }} />
              </label>
              <label className="block">
                <span className="text-xs font-medium opacity-70">Fin</span>
                <input className={input} type="datetime-local" required min={form.inicio} value={form.fin}
                       onChange={e => setForm({ ...form, fin: e.target.value })} />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium opacity-70">Lead</span>
              <select className={input} value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })}>
                <option value="">—</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.nombre}{l.empresa ? ` · ${l.empresa}` : ''}</option>)}
              </select>
            </label>
            {rol === 'admin' && (
              <label className="block">
                <span className="text-xs font-medium opacity-70">Cliente</span>
                <select className={input} value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })}>
                  <option value="">—</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </label>
            )}
            <label className="block">
              <span className="text-xs font-medium opacity-70">Notas</span>
              <textarea className={input} rows={3} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
            </label>
            {(form.lead_id || form.cliente_id) && form.id && (
              <p className="text-xs">
                {form.lead_id && <Link className="underline mr-3" to={`/leads/${form.lead_id}`}>Ver lead</Link>}
                {form.cliente_id && rol === 'admin' && <Link className="underline" to={`/clientes/${form.cliente_id}`}>Ver cliente</Link>}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button className={boton} style={acento}>Guardar</button>
              <button type="button" onClick={() => setForm(null)} className="rounded-lg px-4 py-2 text-sm border" style={borde}>Cancelar</button>
              {form.id && <button type="button" onClick={borrar} className="ml-auto text-sm text-red-500 hover:underline">Borrar</button>}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
