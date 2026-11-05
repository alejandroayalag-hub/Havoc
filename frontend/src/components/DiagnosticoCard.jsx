// Diagnóstico del lead: Lili llena el cuestionario en la llamada; al enviarlo queda el extracto para Alejandro.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { getDiagnostico, saveDiagnostico } from '../api/ventas';
import logo from '../assets/havoc-wordmark.svg';
import {
  ORIGENES, RUBROS, BASE, DOLORES, RIESGOS, HERRAMIENTAS, INTERNET, CELULARES, DECIDE, PRESUPUESTO, CUANDO,
  etiqueta, etiquetas, faltantes, temperatura, demosSugeridas,
} from '../lib/diagnostico';

const input = 'w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300';
const borde = { borderColor: 'var(--color-sage)' };
const acento = { backgroundColor: 'var(--color-accent)' };
const dinero = n => Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

export default function DiagnosticoCard({ leadId, modulos = [] }) {
  const [diag, setDiag] = useState(undefined); // undefined = cargando, null = no hay
  const [r, setR] = useState(null);            // respuestas en edición; null = modo extracto
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [imprimir, setImprimir] = useState(false);

  useEffect(() => { getDiagnostico(leadId).then(setDiag).catch(() => setError('No se pudo cargar el diagnóstico')); }, [leadId]);

  useEffect(() => {
    if (!imprimir) return;
    const fin = () => setImprimir(false);
    window.addEventListener('afterprint', fin, { once: true });
    window.print();
    return () => window.removeEventListener('afterprint', fin);
  }, [imprimir]);

  async function guardar(enviar) {
    setError(''); setAviso('');
    if (enviar) {
      const f = faltantes(r);
      if (f.length) return setError(`Falta: ${f.join(', ')}`);
    }
    try {
      const d = await saveDiagnostico(leadId, { respuestas: r, enviar });
      setDiag({ ...diag, ...d });
      if (enviar) setR(null); else setAviso('Borrador guardado');
    } catch (e) { setError(e.response?.data?.error || 'No se pudo guardar'); }
  }

  if (diag === undefined) return null;

  return (
    <div className="bg-white border rounded-xl p-5 mb-6" style={borde}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold">Diagnóstico</h2>
        {diag && <span className="text-xs px-2 py-0.5 rounded-full text-white"
                       style={{ backgroundColor: diag.estado === 'enviado' ? '#15803D' : '#71717A' }}>
          {diag.estado === 'enviado' ? 'Enviado' : 'Borrador'}</span>}
        {!r && (
          <div className="ml-auto flex gap-2">
            {diag?.estado === 'enviado' && (
              <button onClick={() => setImprimir(true)} className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border" style={borde}>
                <Printer className="w-4 h-4" /> PDF</button>
            )}
            <button onClick={() => setR(diag?.respuestas || {})} className="text-sm px-3 py-1.5 rounded-lg text-white" style={acento}>
              {!diag ? 'Llenar diagnóstico' : diag.estado === 'borrador' ? 'Continuar' : 'Editar'}</button>
          </div>
        )}
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {r ? <Formulario r={r} setR={setR} />
         : diag?.estado === 'enviado' ? <Extracto r={diag.respuestas} modulos={modulos} leadId={leadId} />
         : <p className="text-sm opacity-60">{diag ? 'Diagnóstico a medias; dale Continuar.' : 'Aún no se le aplica el cuestionario.'}</p>}

      {r && (
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t" style={borde}>
          <button onClick={() => guardar(true)} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={acento}>
            {diag?.estado === 'enviado' ? 'Guardar cambios' : 'Enviar a Alejandro'}</button>
          {diag?.estado !== 'enviado' && (
            <button onClick={() => guardar(false)} className="rounded-lg px-4 py-2 text-sm border" style={borde}>Guardar borrador</button>
          )}
          <button onClick={() => { setR(null); setError(''); }} className="text-sm px-3 py-2 opacity-70">Cancelar</button>
          {aviso && <span className="text-xs text-green-700">{aviso}</span>}
        </div>
      )}

      {imprimir && createPortal(
        <div className="print-area hidden print:block p-10 text-[#1E1533]">
          <img src={logo} alt="HAVOC" className="h-12 mb-6" />
          <Extracto r={diag.respuestas} modulos={modulos} leadId={leadId} impreso />
        </div>, document.body)}
    </div>
  );
}

// ---------- Formulario (Lili) ----------

function Bloque({ n, titulo, obligatorio, guia, children }) {
  return (
    <section className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{n} · {titulo}{obligatorio && ' ⭐'}</p>
      {guia && <p className="text-xs italic opacity-60 mb-1.5">"{guia}"</p>}
      <div className="space-y-2 mt-1">{children}</div>
    </section>
  );
}

// Botones de una sola opción (clic otra vez = quitar)
function Unica({ opciones, valor, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opciones.map(o => {
        const [k, label] = Array.isArray(o) ? o : [o, o];
        const activo = valor === k;
        return (
          <button type="button" key={k} onClick={() => onChange(activo ? null : k)}
                  className={`text-xs px-3 py-1.5 rounded-full border ${activo ? 'text-white' : 'bg-white'}`}
                  style={activo ? { ...acento, borderColor: 'var(--color-accent)' } : borde}>{label}</button>
        );
      })}
    </div>
  );
}

function Varias({ opciones, valor = [], onChange, extra }) {
  const toggle = k => onChange(valor.includes(k) ? valor.filter(x => x !== k) : [...valor, k]);
  return (
    <div className="grid gap-1 sm:grid-cols-2">
      {opciones.map(([k, label]) => (
        <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={valor.includes(k)} onChange={() => toggle(k)} className="accent-violet-600" />
          <span>{label}{extra?.(k)}</span>
        </label>
      ))}
    </div>
  );
}

function Formulario({ r, setR }) {
  const set = k => v => setR({ ...r, [k]: v });
  const txt = (k, ph, type = 'text') => (
    <input className={input} type={type} min={type === 'number' ? 0 : undefined} placeholder={ph}
           value={r[k] ?? ''} onChange={e => set(k)(e.target.value)} />
  );
  const area = (k, ph) => <textarea className={input} rows={2} placeholder={ph} value={r[k] ?? ''} onChange={e => set(k)(e.target.value)} />;
  const modulosDe = k => { const m = DOLORES.find(d => d.key === k).modulos; return m.length ? <span className="opacity-50"> → {m.join(', ')}</span> : null; };

  return (
    <div>
      <Bloque n={0} titulo="Cómo nos encontró">
        <Unica opciones={ORIGENES} valor={r.origen} onChange={set('origen')} />
        {txt('origen_detalle', '¿Qué anuncio, quién lo recomendó…?')}
      </Bloque>

      <Bloque n={1} titulo="Rubro" obligatorio guia="¿A qué se dedica su empresa y quiénes son sus clientes?">
        <Unica opciones={RUBROS} valor={r.rubro} onChange={set('rubro')} />
        {txt('rubro_detalle', 'Ej. Fletes refrigerados de aguacate a CDMX')}
      </Bloque>

      <Bloque n={2} titulo="Tamaño" obligatorio guia="¿Cuántas personas trabajan con usted? ¿En cuántos lugares?">
        <div className="grid grid-cols-3 gap-2">
          {txt('empleados', 'Empleados', 'number')}{txt('sucursales', 'Sucursales', 'number')}{txt('en_campo', 'En campo', 'number')}
        </div>
      </Bloque>

      <Bloque n={3} titulo="Base administrativa" obligatorio guia="¿Quién lleva hoy el personal, la contabilidad y las computadoras?">
        <Varias opciones={BASE} valor={r.base} onChange={set('base')} />
      </Bloque>

      <Bloque n={4} titulo="Dolor real" obligatorio guia="Cuénteme de ayer: ¿qué le quitó más tiempo?">
        <Varias opciones={DOLORES.map(d => [d.key, d.label])} valor={r.dolores} onChange={set('dolores')} extra={modulosDe} />
        {area('dolor_palabras', 'Lo que dijo, en sus palabras')}
      </Bloque>

      <Bloque n={5} titulo="Cuánto le cuesta" obligatorio guia="¿Cuántas horas a la semana se le van en eso? ¿Ha perdido dinero por eso?">
        <div className="grid grid-cols-2 gap-2">{txt('horas_semana', 'Horas por semana', 'number')}{txt('costo_mes', 'Pesos al mes (aprox.)', 'number')}</div>
        {txt('perdidas', 'Qué ha perdido: cobros, multas, nómina mal pagada…')}
      </Bloque>

      <Bloque n={6} titulo="Una sola cosa" obligatorio guia="Si mañana pudiera resolver una sola cosa, ¿cuál sería?">
        {txt('una_cosa', 'Ej. Saber dónde están los camiones sin llamar')}
      </Bloque>

      <Bloque n={7} titulo="Riesgo laboral / legal" obligatorio guia="¿Ha tenido demandas laborales, inspecciones o problemas con contratos?">
        <Varias opciones={RIESGOS} valor={r.riesgos} onChange={set('riesgos')} />
        {txt('riesgo_detalle', 'Qué pasó')}
      </Bloque>

      <Bloque n={8} titulo="Qué usa hoy y qué ya intentó" guia="¿Ha usado algún sistema o app antes? ¿Por qué lo dejó?">
        <Varias opciones={HERRAMIENTAS} valor={r.herramientas} onChange={set('herramientas')} />
        {txt('intentos', 'Qué probó y por qué lo dejó')}
      </Bloque>

      <Bloque n={9} titulo="Condiciones del lugar">
        <div className="grid gap-2 sm:grid-cols-3 text-xs">
          <div><p className="opacity-60 mb-1">Internet en la operación</p><Unica opciones={INTERNET} valor={r.internet} onChange={set('internet')} /></div>
          <div><p className="opacity-60 mb-1">Empleados con celular</p><Unica opciones={CELULARES} valor={r.celulares} onChange={set('celulares')} /></div>
          <div><p className="opacity-60 mb-1">Computadora en oficina</p><Unica opciones={[['si', 'Sí'], ['no', 'No']]} valor={r.compu} onChange={set('compu')} /></div>
        </div>
      </Bloque>

      <Bloque n={10} titulo="Decisión y presupuesto" obligatorio guia="¿Quién más participa en la decisión? ¿Tiene un monto pensado? ¿Para cuándo lo necesita?">
        <Unica opciones={DECIDE} valor={r.decide} onChange={set('decide')} />
        {r.decide && r.decide !== 'el' && txt('decide_quien', '¿Quién?')}
        <Unica opciones={PRESUPUESTO} valor={r.presupuesto} onChange={set('presupuesto')} />
        <Unica opciones={CUANDO} valor={r.cuando} onChange={set('cuando')} />
      </Bloque>
    </div>
  );
}

// ---------- Extracto (Alejandro) ----------

function Fila({ titulo, children, alerta }) {
  if (!children || (Array.isArray(children) && !children.some(Boolean))) return null;
  return (
    <div className="mb-3">
      <p className={`text-xs font-semibold uppercase tracking-wide ${alerta ? 'text-red-600' : 'opacity-60'}`}>{titulo}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function Extracto({ r, modulos, leadId, impreso }) {
  const temp = temperatura(r);
  const demos = demosSugeridas(r).map(n => modulos.find(m => m.nombre === n) || { nombre: n });
  const riesgos = (r.riesgos || []).filter(k => k !== 'ninguno');
  const tamano = [r.empleados && `${r.empleados} personas`, r.en_campo && `${r.en_campo} en campo`, r.sucursales && `${r.sucursales} sucursal(es)`].filter(Boolean).join(' · ');
  const costo = [r.horas_semana && `${r.horas_semana} h/semana`, r.costo_mes && `~${dinero(r.costo_mes)}/mes`].filter(Boolean).join(' · ');

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-1">
        {temp && <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: temp.color }}>{temp.label}</span>}
        <span className="text-sm font-medium">{[r.rubro, r.rubro_detalle].filter(Boolean).join(' — ')}</span>
      </div>
      <p className="text-xs opacity-60 mb-4">{[tamano, r.origen && `llegó por ${r.origen}${r.origen_detalle ? ` (${r.origen_detalle})` : ''}`].filter(Boolean).join(' · ')}</p>

      <Fila titulo="Quiere resolver primero">{r.una_cosa && <b>{r.una_cosa}</b>}</Fila>
      <Fila titulo="Le duele">
        {r.dolores?.length > 0 && <p>{r.dolores.map(k => DOLORES.find(d => d.key === k)?.label).join(' · ')}</p>}
        {r.dolor_palabras && <p className="italic">"{r.dolor_palabras}"</p>}
      </Fila>
      <Fila titulo="Le cuesta">
        {costo && <p>{costo}{r.costo_mes > 1500 && ' → el sistema se paga solo'}</p>}
        {r.perdidas && <p>{r.perdidas}</p>}
      </Fila>
      <Fila titulo="⚠ Riesgo" alerta>{riesgos.length > 0 && <p>{etiquetas(RIESGOS, riesgos)}{r.riesgo_detalle ? ` — ${r.riesgo_detalle}` : ''}</p>}</Fila>
      <Fila titulo="Base / hoy">
        {r.base?.length > 0 && <p>{etiquetas(BASE, r.base)}</p>}
        {r.herramientas?.length > 0 && <p>Usa: {etiquetas(HERRAMIENTAS, r.herramientas)}</p>}
        {r.intentos && <p>Ya intentó: {r.intentos}</p>}
      </Fila>
      <Fila titulo="Condiciones">
        {(r.internet || r.celulares || r.compu) && <p>{[
          r.internet && `Internet: ${etiqueta(INTERNET, r.internet)}`,
          r.celulares && `Celulares: ${etiqueta(CELULARES, r.celulares)}`,
          r.compu && `Compu: ${r.compu === 'si' ? 'sí' : 'no'}`,
        ].filter(Boolean).join(' · ')}</p>}
      </Fila>
      <Fila titulo="Compra">
        {(r.decide || r.presupuesto || r.cuando) && <p>{[
          r.decide && `Decide: ${etiqueta(DECIDE, r.decide)}${r.decide_quien ? ` (${r.decide_quien})` : ''}`,
          etiqueta(PRESUPUESTO, r.presupuesto), etiqueta(CUANDO, r.cuando),
        ].filter(Boolean).join(' · ')}</p>}
      </Fila>
      <Fila titulo="Demos sugeridas">
        {demos.length > 0 && <ol className="list-decimal list-inside">
          {demos.map(m => <li key={m.nombre}>{m.nombre}
            {!impreso && (m.demo_url
              ? <a href={m.demo_url} target="_blank" rel="noreferrer" className="ml-2 text-xs underline opacity-70">ver demo</a>
              : <span className="ml-2 text-xs opacity-50">sin demo</span>)}
          </li>)}
        </ol>}
      </Fila>
      {!impreso && (
        <Link to={`/agenda?lead=${leadId}`} className="inline-block mt-2 text-sm px-3 py-1.5 rounded-lg text-white" style={acento}>
          Agendar entrevista</Link>
      )}
    </div>
  );
}
