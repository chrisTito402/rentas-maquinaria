import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import '../paginas/operacion/operacion.css';
import './gestion.css';

export default function GestionLayout() {
  const [abierto, setAbierto] = useState(false);
  const { pathname } = useLocation();
  const toggle = useRef(null);
  const menu = useRef(null);
  useEffect(() => {
    setAbierto(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('contenido-gestion')?.focus({ preventScroll: true });
  }, [pathname]);
  useEffect(() => {
    if (!abierto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menu.current?.querySelector('a')?.focus();
    function keydown(event) {
      if (event.key === 'Escape') { setAbierto(false); toggle.current?.focus(); }
      if (event.key !== 'Tab') return;
      const items = [...menu.current.querySelectorAll('a, button')];
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = anterior; document.removeEventListener('keydown', keydown); };
  }, [abierto]);
  const operacion = pathname.includes('/operacion') || pathname.includes('/rentas/');
  return <div className="operacion gestion">
    <a className="skip-link" href="#contenido-gestion">Ir al contenido</a>
    <div className="app-shell">
      <button className={'sidebar-overlay ' + (abierto ? 'visible' : '')} aria-label="Cerrar menú" onClick={() => { setAbierto(false); toggle.current?.focus(); }} />
      <aside className={'sidebar ' + (abierto ? 'open' : '')} ref={menu} aria-label="Menú de gestión">
        <Link className="gestion-brand" to="/gestion/inicio">RENTA DE MAQUINARIA<small>Gestión comercial y operativa</small></Link>
        <span className="nav-heading">GESTIÓN</span>
        <nav aria-label="Secciones de gestión">
          <NavLink className="nav-item" to="/gestion/inicio">Inicio</NavLink>
          <NavLink className="nav-item" to="/gestion/cotizaciones">Cotizaciones</NavLink>
          <NavLink className={'nav-item ' + (operacion ? 'active' : '')} to="/gestion/operacion" aria-current={operacion ? 'page' : undefined}>Operación</NavLink>
          <NavLink className="nav-item" to="/gestion/inventario">Inventario</NavLink>
          <NavLink className="nav-item" to="/gestion/historial">Historial</NavLink>
        </nav>
        <div className="sidebar-bottom"><p className="menu-help">Sigue cada solicitud desde la cotización hasta el regreso del equipo.</p><Link to="/" className="nav-item">← Volver al catálogo</Link></div>
        <button className="button soft mobile-menu-close" onClick={() => { setAbierto(false); toggle.current?.focus(); }}>Cerrar menú</button>
      </aside>
      <div className="workspace">
        <header className="topbar gestion-topbar">
          <button ref={toggle} className="icon-button mobile-toggle" aria-label="Abrir menú de gestión" aria-expanded={abierto} onClick={() => setAbierto(true)}>☰</button>
          <div><strong>Gestión</strong><small>Comercial y Operaciones, en un mismo lugar</small></div>
          <Link className="catalog-return" to="/">Ver catálogo ↗</Link>
        </header>
        <main id="contenido-gestion" className={'main-content' + (pathname.startsWith('/gestion/cotizaciones') ? ' comercial comercial-integrada' : '')} tabIndex={-1}><Outlet /></main>
        <footer className="workspace-footer">Renta de maquinaria · Gestión</footer>
      </div>
    </div>
  </div>;
}
