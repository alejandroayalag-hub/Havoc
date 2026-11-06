// Post-its fijos en la esquina inferior izquierda: recados para todos o para una persona.
import { useEffect, useState } from 'react';
import { getRecados, getUsuariosRecados, createRecado, recadoHecho } from '../api/recados';

const COLORES = { amarillo: 'bg-yellow-200', rosa: 'bg-pink-200', verde: 'bg-lime-200', azul: 'bg-sky-200' };
const fecha = (iso) => new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const leerMin = () => { try { return localStorage.getItem('recados_min') === '1'; } catch { return false; } };

export default function Recados() {
  const [recados, setRecados] = useState([]);
  const [i, setI] = useState(0);
  const [min, setMin] = useState(leerMin);
  const [form, setForm] = useState(null); // null = cerrado
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');

  const cargar = () => getRecados().then(setRecados).catch(() => {});
  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 60_000); // ponytail: polling 1 min, websockets si algún día urge al segundo
    return () => clearInterval(t);
  }, []);

  function minimizar(v) {
    setMin(v);
    try { localStorage.setItem('recados_min', v ? '1' : '0'); } catch { /* sin storage */ }
  }

  function abrirForm() {
    setForm({ texto: '', para_id: '', color: 'amarillo' });
    setError('');
    if (!usuarios.length) getUsuariosRecados().then(setUsuarios).catch(() => {});
  }

  async function guardar(e) {
    e.preventDefault();
    try {
      await createRecado({ ...form, para_id: form.para_id || null });
      setForm(null); setI(0); minimizar(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar');
    }
  }

  async function hecho(id) {
    await recadoHecho(id).catch(() => {});
    setI(0);
    cargar();
  }

  const r = recados[Math.min(i, recados.length - 1)];
  const n = recados.length;

  if (min) {
    return (
      <button onClick={() => minimizar(false)} title="Ver recados"
              className="fixed bottom-4 left-4 z-40 print:hidden bg-yellow-200 text-stone-800 text-xs font-semibold px-3 py-2 rounded shadow-lg -rotate-2 hover:rotate-0 transition-transform">
        📝 {n ? `${n} recado${n > 1 ? 's' : ''}` : 'Recados'}
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 left-8 z-40 print:hidden w-72 text-stone-800">
      {form ? (
        <form onSubmit={guardar} className={`${COLORES[form.color]} w-72 h-72 p-4 flex flex-col gap-2 rounded-sm shadow-[4px_10px_18px_rgba(0,0,0,.55)] -rotate-2`}>
          <textarea autoFocus required maxLength={500} value={form.texto}
                    onChange={e => setForm({ ...form, texto: e.target.value })}
                    placeholder="Escribe el recado…"
                    className="w-full flex-1 bg-transparent font-mano text-2xl leading-tight resize-none outline-none placeholder:text-stone-500" />
          <label className="flex items-center gap-2 text-xs">
            Para:
            <select value={form.para_id} onChange={e => setForm({ ...form, para_id: e.target.value })}
                    className="flex-1 bg-white/60 text-stone-800 rounded px-1 py-0.5">
              <option value="">Todos</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-1.5">
            {Object.entries(COLORES).map(([c, cls]) => (
              <button type="button" key={c} onClick={() => setForm({ ...form, color: c })} aria-label={c}
                      className={`${cls} w-5 h-5 shrink-0 rounded-full border ${form.color === c ? 'border-stone-800 border-2' : 'border-stone-500/40'}`} />
            ))}
            <span className="flex-1" />
            <button type="button" onClick={() => setForm(null)} className="text-xs px-2 py-1 hover:underline">Cancelar</button>
            <button type="submit" className="text-xs px-2 py-1 rounded bg-stone-800 text-yellow-50">Pegar</button>
          </div>
          {error && <p className="text-xs text-red-700">{error}</p>}
        </form>
      ) : (
        <div className="relative">
          {/* hojas de abajo para que se vea pila */}
          {n > 1 && <div className={`absolute inset-0 ${COLORES[recados[1]?.color] || COLORES.amarillo} rounded-sm shadow-lg rotate-[4deg] translate-x-2`} />}
          {n > 2 && <div className="absolute inset-0 bg-yellow-100 rounded-sm shadow-lg -rotate-[9deg] -translate-x-1" />}

          <div className={`relative ${r ? COLORES[r.color] : COLORES.amarillo} w-72 h-72 p-4 pt-5 flex flex-col rounded-sm shadow-[4px_10px_18px_rgba(0,0,0,.55)] -rotate-[5deg] hover:-rotate-[2deg] transition-transform`}>
            <div className="flex items-center gap-1 text-[11px] text-stone-600 mb-1">
              <span className="flex-1 truncate">
                {r ? <>{r.autor_nombre || '—'} → <b>{r.para_nombre || 'Todos'}</b></> : 'Recados'}
              </span>
              <button onClick={abrirForm} title="Nuevo recado" className="px-1.5 text-lg font-bold hover:text-black">＋</button>
              <button onClick={() => minimizar(true)} title="Minimizar" className="px-1.5 text-lg font-bold hover:text-black">–</button>
            </div>

            {r ? (
              <>
                <p className="flex-1 font-mano text-2xl leading-tight whitespace-pre-wrap break-words overflow-y-auto">{r.texto}</p>
                <div className="flex items-center gap-1 mt-2 text-[11px] text-stone-600">
                  <span className="flex-1">{fecha(r.created_at)}</span>
                  {n > 1 && <>
                    <button onClick={() => setI((i - 1 + n) % n)} className="px-1 hover:text-black" aria-label="Anterior">‹</button>
                    <span>{Math.min(i, n - 1) + 1}/{n}</span>
                    <button onClick={() => setI((i + 1) % n)} className="px-1 hover:text-black" aria-label="Siguiente">›</button>
                  </>}
                  <button onClick={() => hecho(r.id)} title="Marcar como hecho"
                          className="ml-1 px-2 py-0.5 rounded bg-stone-800 text-yellow-50 hover:bg-black">✓</button>
                </div>
              </>
            ) : (
              <button onClick={abrirForm} className="flex-1 font-mano text-2xl text-stone-600 hover:text-black">Sin recados. ＋ Pegar uno</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
