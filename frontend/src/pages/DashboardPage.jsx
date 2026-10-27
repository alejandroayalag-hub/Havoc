import { Link } from 'react-router-dom';
import { Target, LayoutGrid, Megaphone, Users } from 'lucide-react';

const MODULOS = [
  { label: 'Leads de venta', desc: 'Prospectos, etapas y cotizaciones', to: '/leads', Icon: Target },
  { label: 'Catálogo', desc: 'Módulos listos para vender y sus precios', to: '/catalogo', Icon: LayoutGrid },
  { label: 'Marketing', desc: 'Logos, presentaciones y videos demo para mandar', to: '/marketing', Icon: Megaphone },
  { label: 'Personal', desc: 'Expedientes, documentos, pagos y checador', to: '/empleados', Icon: Users, adminOnly: true },
];

export default function DashboardPage() {
  const rol = localStorage.getItem('rol');

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold mb-1">Control sobre el caos operativo.</h1>
      <p className="text-sm opacity-60 mb-8">HAVOC — Soluciones Integradas</p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {MODULOS.filter(m => !m.adminOnly || rol === 'admin').map(m => (
          <Link key={m.to} to={m.to}
                className="bg-white rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ borderColor: 'var(--color-sage)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                 style={{ backgroundColor: 'var(--color-primary)' }}>
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
