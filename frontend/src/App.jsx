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
import LoginPage from './pages/LoginPage';
import CambiarPasswordPage from './pages/CambiarPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import logoIcon from './assets/havoc-icon.svg';

function NavItem({ to, end, children }) {
  return (
    <NavLink to={to} end={end}
             className={({ isActive }) =>
               `text-sm px-3 py-1.5 rounded-lg transition-colors ${isActive ? 'font-semibold text-white' : 'text-white/70 hover:text-white'}`
             }
             style={({ isActive }) => ({ backgroundColor: isActive ? 'var(--color-accent)' : 'transparent' })}>
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
      <nav className="px-4 md:px-6 py-2 flex items-center gap-3 flex-wrap print:hidden"
           style={{ backgroundColor: 'var(--color-dark)' }}>
        <NavLink to="/" className="mr-3 flex items-center gap-2 flex-shrink-0">
          <img src={logoIcon} alt="" className="h-8 w-8" />
          <span className="font-display font-bold text-white tracking-wide">HAVOC</span>
          <span className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--color-violet)' }}>CONTROL</span>
        </NavLink>

        <div className="flex gap-1 flex-1 flex-wrap">
          <NavItem to="/" end>Inicio</NavItem>
          <NavItem to="/leads">Leads</NavItem>
          <NavItem to="/catalogo">Catálogo</NavItem>
          {rol === 'admin' && <NavItem to="/empleados">Personal</NavItem>}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-white/60">{nombre} · {rol === 'admin' ? 'Admin' : 'Usuario'}</span>
          <button onClick={logout}
                  className="text-xs border border-white/30 text-white/80 rounded px-2 py-1 hover:text-white">
            Salir
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/leads/:id" element={<LeadDetallePage />} />
          <Route path="/catalogo" element={<CatalogoPage />} />
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
