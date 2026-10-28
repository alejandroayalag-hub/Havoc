import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import {
  getCobros, updateCobro, deleteCobro, getGastos, createGasto, deleteGasto, getReporte, getClientes,
  CATEGORIAS_GASTO, dia, fechaCorta, hoy,
} from '../api/clientes';
import { dinero } from '../api/ventas';
import { TablaCobros } from './ClienteDetallePage';

const input = 'min-w-0 border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300';
const borde = { borderColor: 'var(--color-sage)' };
const PESTANAS = [['debe', 'Quién debe'], ['cobrado', 'Cobrado'], ['gastos', 'Gastos'], ['reporte', 'Reporte']];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function FinanzasPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'debe';
  const [error, setError] = useState('');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Finanzas</h1>
      <div className="flex gap-1 border-b mb-5 overflow-x-auto overflow-y-hidden" style={borde}>
        {PESTANAS.map(([k, label]) => (
          <button key={k} onClick={() => { setError(''); setParams({ tab: k }); }}
                  className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 -mb-px ${tab === k ? 'font-semibold border-violet-600' : 'border-transparent opacity-60 hover:opacity-100'}`}>
            {label}
          </button>
        ))}
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {tab === 'debe' && <Cobros estado="pendiente" setError={setError} />}
      {tab === 'cobrado' && <Cobros estado="pagado" setError={setError} />}
      {tab === 'gastos' && <Gastos setError={setError} />}
      {tab === 'reporte' && <Reporte setError={setError} />}
    </div>
  );
}

const fallo = (setError) => (e) => setError(e.response?.data?.error || 'Ocurrió un error');

function Cobros({ estado, setError }) {
  const [cobros, setCobros] = useState(null);
  const cargar = () => getCobros(estado).then(setCobros).catch(fallo(setError));
  useEffect(() => { cargar(); }, [estado]);
  if (!cobros) return <p className="opacity-60">Cargando…</p>;

  const accion = (fn) => fn().then(cargar).catch(fallo(setError));
  const total = cobros.reduce((s, c) => s + Number(c.monto), 0);
  const vencido = cobros.filter(c => !c.pagado_el && dia(c.vence) < hoy()).reduce((s, c) => s + Number(c.monto), 0);

  return (
    <>
      <div className="flex flex-wrap gap-6 mb-4 text-sm">
        <span><span className="opacity-60">{estado === 'pagado' ? 'Cobrado (últimos 1000)' : 'Por cobrar'} </span><span className="font-mono font-semibold">{dinero(total)}</span></span>
        {estado !== 'pagado' && <span><span className="opacity-60">Vencido </span><span className="font-mono font-semibold text-red-600">{dinero(vencido)}</span></span>}
      </div>
      <TablaCobros cobros={cobros} conCliente
                   pagar={(c) => accion(() => updateCobro(c.id, { pagado_el: c.pagado_el ? '' : hoy() }))}
                   borrar={(c) => window.confirm(`¿Borrar el cobro "${c.concepto}" de ${c.cliente_nombre}?`) && accion(() => deleteCobro(c.id))} />
      {estado !== 'pagado' && <p className="text-xs opacity-60 mt-3">Para agregar un cobro de desarrollo entra a la ficha del cliente.</p>}
    </>
  );
}

function Gastos({ setError }) {
  const [mes, setMes] = useState(hoy().slice(0, 7));
  const [gastos, setGastos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const vacio = { fecha: hoy(), concepto: '', categoria: 'servidor', monto: '', cliente_id: '' };
  const [nuevo, setNuevo] = useState(vacio);

  const cargar = () => getGastos(mes).then(setGastos).catch(fallo(setError));
  useEffect(() => { cargar(); }, [mes]);
  useEffect(() => { getClientes().then(setClientes).catch(() => {}); }, []);

  async function agregar(e) {
    e.preventDefault();
    setError('');
    try {
      await createGasto(nuevo);
      setNuevo({ ...vacio, fecha: nuevo.fecha, categoria: nuevo.categoria });
      if (nuevo.fecha.slice(0, 7) === mes) cargar(); else setMes(nuevo.fecha.slice(0, 7));
    } catch (err) { fallo(setError)(err); }
  }

  const total = gastos.reduce((s, g) => s + Number(g.monto), 0);

  return (
    <>
      <form onSubmit={agregar} className="bg-white border rounded-xl p-4 mb-4 grid gap-2 md:grid-cols-[10rem_1fr_11rem_9rem_11rem_auto]" style={borde}>
        <input className={input} type="date" required value={nuevo.fecha} aria-label="Fecha" onChange={e => setNuevo({ ...nuevo, fecha: e.target.value })} />
        <input className={input} placeholder="Concepto (ej. Hetzner octubre) *" required value={nuevo.concepto}
               onChange={e => setNuevo({ ...nuevo, concepto: e.target.value })} />
        <select className={input} value={nuevo.categoria} aria-label="Categoría" onChange={e => setNuevo({ ...nuevo, categoria: e.target.value })}>
          {Object.entries(CATEGORIAS_GASTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input className={`${input} font-mono`} type="number" min="0.01" step="0.01" placeholder="Monto *" required value={nuevo.monto}
               onChange={e => setNuevo({ ...nuevo, monto: e.target.value })} />
        <select className={input} value={nuevo.cliente_id} aria-label="Cliente" onChange={e => setNuevo({ ...nuevo, cliente_id: e.target.value })}>
          <option value="">General (HAVOC)</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <button className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-accent)' }}>+ Gasto</button>
      </form>

      <div className="flex items-center gap-3 mb-3">
        <input className={input} type="month" value={mes} aria-label="Mes" onChange={e => e.target.value && setMes(e.target.value)} />
        <span className="ml-auto text-sm"><span className="opacity-60">Total del mes </span><span className="font-mono font-semibold">{dinero(total)}</span></span>
      </div>

      <div className="bg-white border rounded-xl overflow-x-auto" style={borde}>
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: 'var(--color-primary)' }}>
            <tr>{['Fecha', 'Concepto', 'Categoría', 'Cliente', 'Monto', ''].map((h, i) => (
              <th key={i} className={`px-4 py-2 text-xs font-semibold ${h === 'Monto' ? 'text-right' : 'text-left'}`}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {gastos.map(g => (
              <tr key={g.id} className="border-t" style={borde}>
                <td className="px-4 py-2 font-mono text-xs">{fechaCorta(g.fecha)}</td>
                <td className="px-4 py-2">{g.concepto}</td>
                <td className="px-4 py-2 text-xs">{CATEGORIAS_GASTO[g.categoria]}</td>
                <td className="px-4 py-2 text-xs">{g.cliente_nombre || <span className="opacity-50">General</span>}</td>
                <td className="px-4 py-2 text-right font-mono">{dinero(g.monto)}</td>
                <td className="px-2 py-2">
                  <button aria-label="Borrar gasto"
                          onClick={() => window.confirm(`¿Borrar "${g.concepto}"?`) && deleteGasto(g.id).then(cargar).catch(fallo(setError))}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
            {!gastos.length && <tr><td colSpan={6} className="px-4 py-8 text-center opacity-50">Sin gastos este mes</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Reporte({ setError }) {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [r, setR] = useState(null);
  useEffect(() => { getReporte(anio).then(setR).catch(fallo(setError)); }, [anio]);
  if (!r) return <p className="opacity-60">Cargando…</p>;

  const n = (v) => Number(v);
  const tot = r.meses.reduce((t, m) => ({ ingreso: t.ingreso + n(m.ingreso), gasto: t.gasto + n(m.gasto) }), { ingreso: 0, gasto: 0 });
  const conMovimiento = r.clientes.filter(c => n(c.ingreso) || n(c.gasto) || n(c.por_cobrar));
  const ganancia = (v) => <span className={v < 0 ? 'text-red-600' : ''}>{dinero(v)}</span>;
  const th = (h, i) => <th key={i} className={`px-4 py-2 text-xs font-semibold ${i ? 'text-right' : 'text-left'}`}>{h}</th>;

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setAnio(anio - 1)} className="px-2 py-1 border rounded" style={borde} aria-label="Año anterior">‹</button>
        <span className="font-mono font-semibold">{anio}</span>
        <button onClick={() => setAnio(anio + 1)} className="px-2 py-1 border rounded" style={borde} aria-label="Año siguiente">›</button>
        <span className="ml-auto text-xs opacity-60">Ingreso = lo cobrado, por fecha de pago.</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="bg-white border rounded-xl overflow-x-auto self-start" style={borde}>
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: 'var(--color-primary)' }}><tr>{['Mes', 'Ingreso', 'Gasto', 'Ganancia'].map(th)}</tr></thead>
            <tbody className="font-mono">
              {r.meses.map(m => (
                <tr key={m.mes} className="border-t" style={borde}>
                  <td className="px-4 py-1.5 font-sans">{MESES[m.mes - 1]}</td>
                  <td className="px-4 py-1.5 text-right">{n(m.ingreso) ? dinero(m.ingreso) : '—'}</td>
                  <td className="px-4 py-1.5 text-right">{n(m.gasto) ? dinero(m.gasto) : '—'}</td>
                  <td className="px-4 py-1.5 text-right">{n(m.ingreso) || n(m.gasto) ? ganancia(n(m.ingreso) - n(m.gasto)) : '—'}</td>
                </tr>
              ))}
              <tr className="border-t-2 font-semibold" style={borde}>
                <td className="px-4 py-2 font-sans">Total</td>
                <td className="px-4 py-2 text-right">{dinero(tot.ingreso)}</td>
                <td className="px-4 py-2 text-right">{dinero(tot.gasto)}</td>
                <td className="px-4 py-2 text-right">{ganancia(tot.ingreso - tot.gasto)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white border rounded-xl overflow-x-auto self-start" style={borde}>
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: 'var(--color-primary)' }}><tr>{['Cliente', 'Ingreso', 'Gasto', 'Ganancia', 'Debe hoy'].map(th)}</tr></thead>
            <tbody className="font-mono">
              {conMovimiento.map(c => (
                <tr key={c.id} className="border-t" style={borde}>
                  <td className="px-4 py-1.5 font-sans"><Link to={`/clientes/${c.id}`} className="hover:underline">{c.nombre}</Link></td>
                  <td className="px-4 py-1.5 text-right">{dinero(c.ingreso)}</td>
                  <td className="px-4 py-1.5 text-right">{dinero(c.gasto)}</td>
                  <td className="px-4 py-1.5 text-right">{ganancia(n(c.ingreso) - n(c.gasto))}</td>
                  <td className={`px-4 py-1.5 text-right ${n(c.por_cobrar) ? 'text-red-600' : ''}`}>{dinero(c.por_cobrar)}</td>
                </tr>
              ))}
              {n(r.gasto_general) > 0 && (
                <tr className="border-t" style={borde}>
                  <td className="px-4 py-1.5 font-sans opacity-60">Gastos generales</td>
                  <td className="px-4 py-1.5 text-right">—</td>
                  <td className="px-4 py-1.5 text-right">{dinero(r.gasto_general)}</td>
                  <td className="px-4 py-1.5 text-right">{ganancia(-n(r.gasto_general))}</td>
                  <td />
                </tr>
              )}
              {!conMovimiento.length && !n(r.gasto_general) && (
                <tr><td colSpan={5} className="px-4 py-8 text-center opacity-50 font-sans">Sin movimientos en {anio}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
