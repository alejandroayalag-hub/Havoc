import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, LayoutGrid, Users } from 'lucide-react';
import { getLeads, ETAPAS } from '../api/ventas';

const MODULOS = [
  { label: 'Leads de venta', desc: 'Prospectos, etapas y cotizaciones', to: '/leads', Icon: Target },
  { label: 'Catálogo', desc: 'Módulos listos para vender y sus precios', to: '/catalogo', Icon: LayoutGrid },
  { label: 'Personal', desc: 'Expedientes, documentos, pagos y checador', to: '/empleados', Icon: Users, adminOnly: true },
];

export default function DashboardPage() {
  const rol = localStorage.getItem('rol');
  const [leads, setLeads] = useState([]);

  useEffect(() => { getLeads().then(setLeads).catch(() => {}); }, []);

  const porEtapa = Object.fromEntries(ETAPAS.map(e => [e.key, leads.filter(l => l.etapa === e.key).length]));

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold mb-1">Control sobre el caos operativo.</h1>
      <p className="text-sm opacity-60 mb-8">HAVOC — Soluciones Integradas</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
        {ETAPAS.map(e => (
          <Link key={e.key} to={`/leads?etapa=${e.key}`}
                className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow"
                style={{ borderColor: 'var(--color-sage)' }}>
            <p className="font-mono text-3xl" style={{ color: e.color }}>{porEtapa[e.key]}</p>
            <p className="text-xs mt-1 opacity-70">{e.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {MODULOS.filter(m => !m.adminOnly || rol === 'admin').map(m => (
          <Link key={m.to} to={m.to}
                className="bg-white rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ borderColor: 'var(--color-sage)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                 style={{ backgroundColor: 'var(--color-dark)' }}>
              <m.Icon className="w-5 h-5" style={{ color: 'var(--color-violet)' }} strokeWidth={1.8} />
            </div>
            <h2 className="font-semibold mb-1">{m.label}</h2>
            <p className="text-xs opacity-60">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
