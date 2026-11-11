// Encabezado y menú de la página del cliente (frame «1 · Catálogo de equipos» del Figma).
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useCarrito } from '../carrito/CarritoContext.jsx';

export default function Layout() {
  const { lineas } = useCarrito();
  const [salta, setSalta] = useState(false);
  const anterior = useRef(lineas.length);

  // El contador de "Mi cotización" brinca cuando se agrega un equipo.
  useEffect(() => {
    if (lineas.length > anterior.current) {
      setSalta(true);
      const t = setTimeout(() => setSalta(false), 500);
      anterior.current = lineas.length;
      return () => clearTimeout(t);
    }
    anterior.current = lineas.length;
  }, [lineas.length]);

  return (
    <div className="sitio">
      <header className="sitio-encabezado">
        <div className="sitio-encabezado__fila">
          <Link to="/" className="sitio-marca">
            <span className="sitio-marca__logo"><img src="/img/iconos/logo.svg" alt="" /></span>
            <span>
              <span className="sitio-marca__nombre">Renta de Maquinaria</span>
              <span className="sitio-marca__lugar">Cd. Obregón, Sonora</span>
            </span>
          </Link>
          <nav className="sitio-nav" aria-label="Navegación principal">
            <NavLink to="/" end className="sitio-nav__link">Catálogo</NavLink>
            <NavLink to="/mi-cotizacion" className="sitio-nav__cotizacion">
              <img src="/img/iconos/cotizacion.svg" alt="" />
              Mi cotización
              {lineas.length > 0 && <span className={`sitio-nav__globo${salta ? ' salta' : ''}`} aria-label={`${lineas.length} equipos`}>{lineas.length}</span>}
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="sitio-principal">
        <Outlet />
      </main>
      <footer className="sitio-pie">
        <span>Renta de Maquinaria · Cd. Obregón, Sonora</span>
        <Link to="/comercial/cotizaciones">Acceso para personal comercial</Link>
      </footer>
    </div>
  );
}
