// Menú lateral del panel comercial (frames «1 · Bandeja de solicitudes» y «2 · Detalle de solicitud» del Figma).
// En el Sprint 1 el panel todavía no pide usuario: el acceso llega con HU-16.
import { Link, NavLink, Outlet } from 'react-router-dom';
import ProximoSprint from '../../componentes/ProximoSprint.jsx';

export default function PanelLayout() {
  return (
    <div className="comercial">
      <aside className="comercial-menu" aria-label="Menú del panel comercial">
        <Link className="comercial-menu__marca" to="/comercial/cotizaciones">
          <strong>RENTA DE MAQUINARIA</strong>
          <span>CD. OBREGÓN, SONORA</span>
        </Link>
        <nav aria-label="Secciones">
          <NavLink to="/comercial/cotizaciones">Cotizaciones</NavLink>
        </nav>
        <ProximoSprint hu="HU-16" kan="KAN-17" titulo="Acceso con usuario">
          El panel pedirá iniciar sesión para que solo entre el personal.
        </ProximoSprint>
        <div className="comercial-menu__perfil">
          <strong>Área comercial</strong>
          <span>Administrador</span>
          <Link to="/">Ver catálogo público ↗</Link>
        </div>
      </aside>
      <main className="comercial-principal">
        <Outlet />
      </main>
    </div>
  );
}
