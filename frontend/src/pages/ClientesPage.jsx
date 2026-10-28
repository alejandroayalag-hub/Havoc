import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getClientes, createCliente } from '../api/clientes';
import { dinero } from '../api/ventas';

const input = 'min-w-0 border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300';

export default function ClientesPage() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [nuevo, setNuevo] = useState({ nombre: '', contacto: '', telefono: '' });
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  const cargar = () => getClientes().then(setClientes).catch(e => setError(e.response?.data?.error || 'No se pudieron cargar los clientes'));
  useEffect(() => { cargar(); }, []);

  async function agregar(e) {
    e.preventDefault();
    setError('');
    try {
      const c = await createCliente(nuevo);
      navigate(`/clientes/${c.id}`);
    } catch (err) { setError(err.response?.data?.error || 'No se pudo guardar'); }
  }

  const texto = q.trim().toLowerCase();
  const visibles = clientes.filter(c => !texto || [c.nombre, c.contacto, c.rfc].some(v => v?.toLowerCase().includes(texto)));
  const suma = (k) => clientes.filter(c => c.activo).reduce((s, c) => s + Number(c[k]), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Clientes</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[['Clientes activos', clientes.filter(c => c.activo).length, null],
          ['Ingreso mensual', dinero(suma('mensualidad')), null],
          ['Por cobrar', dinero(suma('saldo')), suma('vencido') ? `${dinero(suma('vencido'))} vencido` : null]].map(([label, valor, nota]) => (
          <div key={label} className="bg-white rounded-xl border p-4" style={{ borderColor: 'var(--color-sage)' }}>
            <p className="font-mono text-2xl">{valor}</p>
            <p className="text-xs mt-1 opacity-70">{label}</p>
            {nota && <p className="text-xs mt-1 text-red-600">{nota}</p>}
          </div>
        ))}
      </div>

      <form onSubmit={agregar} className="bg-white border rounded-xl p-4 mb-4 grid gap-2 md:grid-cols-[1fr_1fr_10rem_auto]"
            style={{ borderColor: 'var(--color-sage)' }}>
        <input className={input} placeholder="Cliente / empresa *" required value={nuevo.nombre}
               onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })} />
        <input className={input} placeholder="Contacto" value={nuevo.contacto}
               onChange={e => setNuevo({ ...nuevo, contacto: e.target.value })} />
        <input className={input} placeholder="Teléfono" type="tel" value={nuevo.telefono}
               onChange={e => setNuevo({ ...nuevo, telefono: e.target.value })} />
        <button className="rounded-lg px-4 py-2 text-sm font-medium text-white whitespace-nowrap" style={{ backgroundColor: 'var(--color-accent)' }}>
          + Agregar
        </button>
        {error && <p className="text-sm text-red-600 md:col-span-4">{error}</p>}
      </form>

      <div className="flex mb-4">
        <input className={`${input} ml-auto w-full md:w-64`} placeholder="Buscar…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="bg-white border rounded-xl overflow-x-auto" style={{ borderColor: 'var(--color-sage)' }}>
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: 'var(--color-primary)' }}>
            <tr>
              {['Cliente', 'Sistemas', 'Mensualidad', 'Debe'].map((h, i) => (
                <th key={h} className={`px-4 py-2 text-xs font-semibold ${i > 1 ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map(c => (
              <tr key={c.id} onClick={() => navigate(`/clientes/${c.id}`)}
                  className={`border-t cursor-pointer hover:bg-violet-50 ${c.activo ? '' : 'opacity-50'}`} style={{ borderColor: 'var(--color-sage)' }}>
                <td className="px-4 py-2">
                  <Link to={`/clientes/${c.id}`} className="font-medium">{c.nombre}</Link>
                  {c.contacto && <span className="block text-xs opacity-60">{c.contacto}</span>}
                </td>
                <td className="px-4 py-2">{c.num_sistemas}</td>
                <td className="px-4 py-2 text-right font-mono">{Number(c.mensualidad) ? dinero(c.mensualidad) : '—'}</td>
                <td className={`px-4 py-2 text-right font-mono ${Number(c.vencido) ? 'text-red-600 font-semibold' : ''}`}>
                  {Number(c.saldo) ? dinero(c.saldo) : '—'}
                </td>
              </tr>
            ))}
            {!visibles.length && <tr><td colSpan={4} className="px-4 py-8 text-center opacity-50">Sin clientes</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
