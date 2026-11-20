// Menú lateral del panel comercial (frames «1 · Bandeja de solicitudes» y «2 · Detalle de solicitud» del Figma).
// Reúne Comercial y Operación: las pantallas de Operación conservan su estilo dentro de .operacion.
// HU-16: sesión del personal validada en el servidor.
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSesion } from '../../auth/Sesion.jsx';
import '../operacion/operacion.css';
import '../../componentes/gestion.css';

export default function PanelLayout() {
  const { usuario, salir } = useSesion();
  const [error, setError] = useState('');
  const [cerrando, setCerrando] = useState(false);
  async function cerrarSesion() {
    setCerrando(true);
    setError('');
    try { await salir(); }
    catch { setError('No se pudo cerrar la sesión. Intenta de nuevo.'); }
    finally { setCerrando(false); }
  }
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
        <div className="comercial-menu__perfil">
          <strong>{usuario.nombre}</strong>
          <span>Personal interno</span>
          <button type="button" className="acceso-salir" onClick={cerrarSesion} disabled={cerrando}>{cerrando ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>
          {error && <p role="alert">{error}</p>}
          <Link to="/">Ver catálogo público ↗</Link>
        </div>
      </aside>
      <main className="comercial-principal">
        {cotizaciones ? <Outlet /> : <div className="operacion gestion comercial-operacion"><Outlet /></div>}
      </main>
    </div>
  );
}
