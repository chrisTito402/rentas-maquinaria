// Menú lateral del panel comercial (frames «1 · Bandeja de solicitudes» y «2 · Detalle de solicitud» del Figma).
// Reúne Comercial y Operación: las pantallas de Operación conservan su estilo dentro de .operacion.
// En el Sprint 1 el panel todavía no pide usuario: el acceso llega con HU-16.
import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import ProximoSprint from '../../componentes/ProximoSprint.jsx';
import '../operacion/operacion.css';
import '../../componentes/gestion.css';

export default function PanelLayout() {
  const { pathname } = useLocation();
  const cotizaciones = pathname.startsWith('/comercial/cotizaciones');
  const operacion = pathname.startsWith('/comercial/operacion') || pathname.startsWith('/comercial/rentas/');
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);

  return (
    <div className="comercial">
      <aside className="comercial-menu" aria-label="Menú del panel comercial">
        <Link className="comercial-menu__marca" to="/comercial/inicio">
          <strong>RENTA DE MAQUINARIA</strong>
          <span>CD. OBREGÓN, SONORA</span>
        </Link>
        <nav aria-label="Secciones">
          <NavLink to="/comercial/inicio">Inicio</NavLink>
          <NavLink to="/comercial/cotizaciones">Cotizaciones</NavLink>
          <NavLink to="/comercial/operacion" className={operacion ? 'active' : undefined} aria-current={operacion ? 'page' : undefined}>Operación</NavLink>
          <NavLink to="/comercial/inventario">Inventario</NavLink>
          <NavLink to="/comercial/historial">Historial</NavLink>
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
        {cotizaciones ? <Outlet /> : <div className="operacion gestion comercial-operacion"><Outlet /></div>}
      </main>
    </div>
  );
}
