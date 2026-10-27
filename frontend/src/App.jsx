import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import EmpleadosPage from './pages/EmpleadosPage';
import EmpleadoDetallePage from './pages/EmpleadoDetallePage';
import EmpleadoFormPage from './pages/EmpleadoFormPage';
import MapeoChecadorPage from './pages/MapeoChecadorPage';
import PagosPage from './pages/PagosPage';
import FormatosPage from './pages/FormatosPage';
import LeadsPage from './pages/LeadsPage';
import LeadDetallePage from './pages/LeadDetallePage';
import CatalogoPage from './pages/CatalogoPage';
import MarketingPage from './pages/MarketingPage';
import LoginPage from './pages/LoginPage';
import CambiarPasswordPage from './pages/CambiarPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import logoIcon from './assets/havoc-icon.svg';
import baculo from './assets/havoc-baculo.svg';

function NavItem({ to, end, children }) {
  return (
    <NavLink to={to} end={end}
             className={({ isActive }) =>
               `text-sm px-3 py-1.5 rounded-lg transition-colors ${isActive ? 'font-semibold bg-black text-white' : 'text-zinc-500 hover:text-black'}`
             }>
      {children}
    </NavLink>
  );
}

function Layout() {
  const navigate = useNavigate();
  const nombre = localStorage.getItem('nombre');
  const rol = localStorage.getItem('rol');

  if (localStorage.getItem('debe_cambiar_password') === 'true') {
    return <Navigate to="/cambiar-password" replace />;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('nombre');
    localStorage.removeItem('rol');
    navigate('/login');
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>
      <nav className="px-4 md:px-6 py-2 flex items-center gap-3 flex-wrap print:hidden bg-zinc-100 border-b border-zinc-300">
        <NavLink to="/" className="mr-3 flex items-center gap-2 flex-shrink-0">
          <img src={logoIcon} alt="" className="h-8 w-8" />
          <span className="font-display font-bold text-black tracking-wide">HAVOC</span>
          <span className="font-mono text-[10px] tracking-widest text-zinc-500">CONTROL</span>
        </NavLink>

        <div className="flex gap-1 flex-1 flex-wrap">
          <NavItem to="/" end>Inicio</NavItem>
          <NavItem to="/leads">Leads</NavItem>
          <NavItem to="/catalogo">Catálogo</NavItem>
          <NavItem to="/marketing">Marketing</NavItem>
          {rol === 'admin' && <NavItem to="/empleados">Personal</NavItem>}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">{nombre} · {rol === 'admin' ? 'Admin' : 'Usuario'}</span>
          <button onClick={logout}
                  className="text-xs border border-zinc-400 text-zinc-700 rounded px-2 py-1 hover:bg-black hover:text-white">
            Salir
          </button>
        </div>
      </nav>

      {/* Marca de agua: báculo en la esquina inferior derecha */}
      <img src={baculo} alt="" aria-hidden="true"
           className="fixed -bottom-6 -right-6 w-24 md:w-36 opacity-[0.06] pointer-events-none select-none print:hidden" />

      <main className="max-w-7xl mx-auto p-4 md:p-6 relative">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/leads/:id" element={<LeadDetallePage />} />
          <Route path="/catalogo" element={<CatalogoPage />} />
          <Route path="/marketing" element={<MarketingPage />} />
          {rol === 'admin' && <Route path="/empleados" element={<EmpleadosPage />} />}
          {rol === 'admin' && <Route path="/empleados/nuevo" element={<EmpleadoFormPage />} />}
          {rol === 'admin' && <Route path="/empleados/:id" element={<EmpleadoDetallePage />} />}
          {rol === 'admin' && <Route path="/empleados/:id/editar" element={<EmpleadoFormPage />} />}
          <Route path="/pagos" element={<PagosPage />} />
          <Route path="/checador/mapeo" element={<MapeoChecadorPage />} />
          <Route path="/formatos" element={<FormatosPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cambiar-password" element={<ProtectedRoute><CambiarPasswordPage /></ProtectedRoute>} />
        <Route path="/*" element={<ProtectedRoute><Layout /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
