import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import {
  getCliente, updateCliente, deleteCliente, createSistema, updateSistema, deleteSistema,
  createCobro, updateCobro, deleteCobro, TIPOS_COBRO, dia, fechaCorta, hoy,
} from '../api/clientes';
import { getModulos, dinero } from '../api/ventas';

const input = 'w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300';
const caja = 'bg-white border rounded-xl p-5';
const borde = { borderColor: 'var(--color-sage)' };
const boton = 'rounded-lg px-4 py-2 text-sm font-medium text-white';
const acento = { backgroundColor: 'var(--color-accent)' };

const CAMPOS = [
  ['nombre', 'Cliente / empresa'], ['contacto', 'Contacto'], ['telefono', 'Teléfono'], ['email', 'Correo'],
  ['razon_social', 'Razón social'], ['rfc', 'RFC'],
];
const SISTEMA_VACIO = {
  modulo_id: '', nombre: '', url: '', servidor: '', repo: '', fecha_entrega: '', manual_entregado: false,
  capacitacion: false, mensualidad: '', cobrar_desde: hoy().slice(0, 8) + '01', activo: true,
};

export default function ClienteDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [form, setForm] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [sistema, setSistema] = useState(null);   // formulario abierto: nuevo o edición
  const [cobro, setCobro] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = () => getCliente(id).then(c => { setCliente(c); setForm(c); })
    .catch(e => setError(e.response?.data?.error || 'No se pudo cargar'));
  useEffect(() => { cargar(); getModulos().then(setModulos).catch(() => {}); }, [id]);

  const intenta = async (fn) => {
    setError(''); setAviso('');
    try { await fn(); await cargar(); return true; } catch (e) { setError(e.response?.data?.error || 'Ocurrió un error'); return false; }
  };

  const guardar = (e) => {
    e.preventDefault();
    intenta(() => updateCliente(id, Object.fromEntries([...CAMPOS.map(([k]) => k), 'dia_corte', 'notas', 'activo']
      .map(k => [k, form[k] ?? '']))).then(() => setAviso('Guardado')));
  };

  async function borrar() {
    if (!window.confirm(`¿Borrar a ${cliente.nombre} con sus sistemas y cobros? No se puede deshacer.`)) return;
    if (await intenta(() => deleteCliente(id))) navigate('/clientes');
  }

  async function guardarSistema(e) {
    e.preventDefault();
    const { id: sid, ...datos } = sistema;
    const campos = Object.fromEntries(Object.keys(SISTEMA_VACIO).map(k => [k, datos[k] ?? '']));
    campos.fecha_entrega = dia(campos.fecha_entrega);
    campos.cobrar_desde = dia(campos.cobrar_desde);
    if (await intenta(() => (sid ? updateSistema(id, sid, campos) : createSistema(id, campos)))) setSistema(null);
  }

  async function guardarCobro(e) {
    e.preventDefault();
    if (await intenta(() => createCobro({ ...cobro, cliente_id: id }))) setCobro(null);
  }

  const pagar = (c) => intenta(() => updateCobro(c.id, { pagado_el: c.pagado_el ? '' : hoy() }));

  if (!cliente) return <p className="opacity-60">{error || 'Cargando…'}</p>;
  const pendientes = cliente.cobros.filter(c => !c.pagado_el);
  const saldo = pendientes.reduce((s, c) => s + Number(c.monto), 0);
  const mensual = cliente.sistemas.filter(s => s.activo).reduce((s, x) => s + Number(x.mensualidad), 0);

  return (
    <div>
      <Link to="/clientes" className="text-sm opacity-60 hover:opacity-100">← Clientes</Link>
      <div className="flex flex-wrap items-baseline gap-3 mt-2 mb-6">
        <h1 className="text-2xl font-bold">{cliente.nombre}</h1>
        {!cliente.activo && <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-500 text-white">Inactivo</span>}
        {cliente.lead_id && <Link to={`/leads/${cliente.lead_id}`} className="text-xs opacity-60 hover:underline">ver lead</Link>}
        <span className="ml-auto text-sm">
          <span className="opacity-60">Mensualidad </span><span className="font-mono">{dinero(mensual)}</span>
          <span className="opacity-60 ml-4">Debe </span>
          <span className={`font-mono font-semibold ${saldo ? 'text-red-600' : ''}`}>{dinero(saldo)}</span>
        </span>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <form onSubmit={guardar} className={`${caja} space-y-3 self-start`} style={borde}>
          {CAMPOS.map(([k, label]) => (
            <label key={k} className="block">
              <span className="text-xs font-medium opacity-70">{label}</span>
              <input className={input} value={form[k] || ''} required={k === 'nombre'}
                     onChange={e => setForm({ ...form, [k]: e.target.value })} />
            </label>
          ))}
          <label className="block">
            <span className="text-xs font-medium opacity-70">Día de corte (vence la mensualidad)</span>
            <input className={input} type="number" min="1" max="28" value={form.dia_corte}
                   onChange={e => setForm({ ...form, dia_corte: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-xs font-medium opacity-70">Notas</span>
            <textarea className={input} rows={3} value={form.notas || ''} onChange={e => setForm({ ...form, notas: e.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />
            Activo (si no, deja de generar mensualidades)
          </label>
          <div className="flex items-center gap-3 pt-1">
            <button className={boton} style={acento}>Guardar</button>
            {aviso && <span className="text-xs text-green-700">{aviso}</span>}
            <button type="button" onClick={borrar} className="ml-auto text-xs text-red-600 hover:underline">Borrar cliente</button>
          </div>
        </form>

        <div className="space-y-8 min-w-0">
          {/* Sistemas instalados */}
          <section>
            <div className="flex items-center mb-3">
              <h2 className="text-lg font-semibold">Sistemas instalados</h2>
              {!sistema && <button onClick={() => setSistema({ ...SISTEMA_VACIO })} className={`ml-auto ${boton}`} style={acento}>+ Sistema</button>}
            </div>

            {sistema && (
              <form onSubmit={guardarSistema} className={`${caja} border-2 mb-4 grid gap-3 md:grid-cols-2`} style={{ borderColor: 'var(--color-violet)' }}>
                <label className="block">
                  <span className="text-xs font-medium opacity-70">Módulo del catálogo</span>
                  <select className={input} value={sistema.modulo_id || ''}
                          onChange={e => {
                            const m = modulos.find(x => String(x.id) === e.target.value);
                            setSistema({ ...sistema, modulo_id: e.target.value, nombre: sistema.nombre || m?.nombre || '',
                                         mensualidad: sistema.mensualidad || m?.mensualidad || '' });
                          }}>
                    <option value="">— Ninguno (a la medida) —</option>
                    {modulos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </label>
                {[['nombre', 'Nombre *'], ['url', 'URL / dominio'], ['servidor', 'Servidor'], ['repo', 'Repositorio']].map(([k, label]) => (
                  <label key={k} className="block">
                    <span className="text-xs font-medium opacity-70">{label}</span>
                    <input className={input} value={sistema[k] || ''} required={k === 'nombre'}
                           onChange={e => setSistema({ ...sistema, [k]: e.target.value })} />
                  </label>
                ))}
                <label className="block">
                  <span className="text-xs font-medium opacity-70">Fecha de entrega</span>
                  <input className={input} type="date" value={dia(sistema.fecha_entrega)}
                         onChange={e => setSistema({ ...sistema, fecha_entrega: e.target.value })} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium opacity-70">Mensualidad</span>
                  <input className={`${input} font-mono`} type="number" min="0" step="0.01" value={sistema.mensualidad}
                         onChange={e => setSistema({ ...sistema, mensualidad: e.target.value })} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium opacity-70">Cobrar mensualidad desde (mes)</span>
                  <input className={input} type="month" value={dia(sistema.cobrar_desde).slice(0, 7)}
                         onChange={e => setSistema({ ...sistema, cobrar_desde: e.target.value ? `${e.target.value}-01` : '' })} />
                </label>
                <div className="flex flex-wrap gap-4 items-center text-sm md:col-span-2">
                  {[['manual_entregado', 'Manual entregado'], ['capacitacion', 'Capacitación dada'], ['activo', 'Activo']].map(([k, label]) => (
                    <label key={k} className="flex items-center gap-2">
                      <input type="checkbox" checked={!!sistema[k]} onChange={e => setSistema({ ...sistema, [k]: e.target.checked })} /> {label}
                    </label>
                  ))}
                </div>
                <p className="text-xs opacity-60 md:col-span-2">Las contraseñas no se guardan aquí: van en el anexo de credenciales.</p>
                <div className="flex gap-2 md:col-span-2">
                  <button className={boton} style={acento}>Guardar sistema</button>
                  <button type="button" onClick={() => setSistema(null)} className="text-sm px-3 py-2 opacity-70">Cancelar</button>
                </div>
              </form>
            )}

            <div className="grid gap-3 xl:grid-cols-2">
              {cliente.sistemas.map(s => (
                <div key={s.id} className={`${caja} !p-4 ${s.activo ? '' : 'opacity-50'}`} style={borde}>
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{s.nombre}</p>
                      <p className="text-xs opacity-60">{s.modulo_nombre || 'A la medida'}{s.servidor ? ` · ${s.servidor}` : ''}</p>
                    </div>
                    <button onClick={() => setSistema(s)} aria-label="Editar sistema"><Pencil className="w-4 h-4 opacity-60" /></button>
                    <button onClick={() => window.confirm(`¿Quitar ${s.nombre}?`) && intenta(() => deleteSistema(id, s.id))} aria-label="Quitar sistema">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 text-xs font-mono text-violet-700 hover:underline break-all">
                      <ExternalLink className="w-3 h-3 flex-shrink-0" /> {s.url}
                    </a>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                    <span className="font-mono">{Number(s.mensualidad) ? `${dinero(s.mensualidad)}/mes` : 'Sin mensualidad'}</span>
                    {s.fecha_entrega && <span className="opacity-60">Entregado {fechaCorta(s.fecha_entrega)}</span>}
                    <span className={s.manual_entregado ? 'text-green-700' : 'opacity-50'}>{s.manual_entregado ? '✓' : '✗'} Manual</span>
                    <span className={s.capacitacion ? 'text-green-700' : 'opacity-50'}>{s.capacitacion ? '✓' : '✗'} Capacitación</span>
                  </div>
                </div>
              ))}
              {!cliente.sistemas.length && <p className="text-sm opacity-50">Sin sistemas.</p>}
            </div>
          </section>

          {/* Estado de cuenta */}
          <section>
            <div className="flex items-center mb-3">
              <h2 className="text-lg font-semibold">Estado de cuenta</h2>
              {!cobro && (
                <button onClick={() => setCobro({ tipo: 'desarrollo', concepto: '', monto: '', vence: hoy() })}
                        className={`ml-auto ${boton}`} style={acento}>+ Cobro</button>
              )}
            </div>
            <p className="text-xs opacity-60 mb-3">Las mensualidades se cargan solas cada mes. Para cobrar el desarrollo en partes, agrega un cobro por parte (anticipo, liquidación).</p>

            {cobro && (
              <form onSubmit={guardarCobro} className={`${caja} border-2 mb-4 grid gap-2 md:grid-cols-[9rem_1fr_9rem_10rem_auto]`} style={{ borderColor: 'var(--color-violet)' }}>
                <select className={input} value={cobro.tipo} onChange={e => setCobro({ ...cobro, tipo: e.target.value })}>
                  {Object.entries(TIPOS_COBRO).filter(([k]) => k !== 'mensualidad').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input className={input} placeholder="Concepto (ej. Anticipo 50%)" required value={cobro.concepto}
                       onChange={e => setCobro({ ...cobro, concepto: e.target.value })} />
                <input className={`${input} font-mono`} type="number" min="0.01" step="0.01" placeholder="Monto" required value={cobro.monto}
                       onChange={e => setCobro({ ...cobro, monto: e.target.value })} />
                <input className={input} type="date" required value={cobro.vence} aria-label="Vence"
                       onChange={e => setCobro({ ...cobro, vence: e.target.value })} />
                <div className="flex gap-1">
                  <button className={boton} style={acento}>Agregar</button>
                  <button type="button" onClick={() => setCobro(null)} className="text-sm px-2 opacity-70">✕</button>
                </div>
              </form>
            )}

            <TablaCobros cobros={cliente.cobros} pagar={pagar}
                         borrar={(c) => window.confirm(`¿Borrar el cobro "${c.concepto}"?`) && intenta(() => deleteCobro(c.id))} />
          </section>

          {cliente.gastos.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Gastos de este cliente</h2>
              <ul className={`${caja} !p-4 text-sm space-y-1`} style={borde}>
                {cliente.gastos.map(g => (
                  <li key={g.id} className="flex gap-3">
                    <span className="font-mono text-xs opacity-60 w-20">{fechaCorta(g.fecha)}</span>
                    <span className="flex-1">{g.concepto}</span>
                    <span className="font-mono">{dinero(g.monto)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export function TablaCobros({ cobros, pagar, borrar, conCliente }) {
  const hoyStr = hoy();
  return (
    <div className="bg-white border rounded-xl overflow-x-auto" style={borde}>
      <table className="w-full text-sm">
        <thead style={{ backgroundColor: 'var(--color-primary)' }}>
          <tr>
            {[...(conCliente ? ['Cliente'] : []), 'Concepto', 'Vence', 'Monto', 'Pagado', ''].map((h, i) => (
              <th key={i} className={`px-4 py-2 text-xs font-semibold ${h === 'Monto' ? 'text-right' : 'text-left'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cobros.map(c => {
            const vencido = !c.pagado_el && dia(c.vence) < hoyStr;
            return (
              <tr key={c.id} className={`border-t ${c.pagado_el ? 'opacity-60' : ''}`} style={borde}>
                {conCliente && <td className="px-4 py-2"><Link to={`/clientes/${c.cliente_id}`} className="font-medium hover:underline">{c.cliente_nombre}</Link></td>}
                <td className="px-4 py-2">{c.concepto}<span className="block text-xs opacity-50">{TIPOS_COBRO[c.tipo]}</span></td>
                <td className={`px-4 py-2 font-mono text-xs whitespace-nowrap ${vencido ? 'text-red-600 font-semibold' : ''}`}>
                  {fechaCorta(c.vence)}{vencido && ' · vencido'}
                </td>
                <td className="px-4 py-2 text-right font-mono">{dinero(c.monto)}</td>
                <td className="px-4 py-2">
                  <button onClick={() => pagar(c)}
                          className={`text-xs px-2 py-1 rounded border whitespace-nowrap ${c.pagado_el ? 'border-green-600 text-green-700' : ''}`}
                          style={c.pagado_el ? {} : borde} title={c.pagado_el ? 'Clic para marcar como no pagado' : ''}>
                    {c.pagado_el ? `✓ ${fechaCorta(c.pagado_el)}` : 'Marcar pagado'}
                  </button>
                </td>
                <td className="px-2 py-2">
                  <button onClick={() => borrar(c)} aria-label="Borrar cobro"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </td>
              </tr>
            );
          })}
          {!cobros.length && <tr><td colSpan={6} className="px-4 py-8 text-center opacity-50">Sin cobros</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
