// Encabezado y menú de la página del cliente (frame «1 · Catálogo de equipos» del Figma).
// HU-13b (Chris): botón del municipio de entrega en el encabezado.
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useCarrito } from '../carrito/CarritoContext.jsx';
import ElegirMunicipio from './ElegirMunicipio.jsx';

export default function Layout() {
  const { lineas, municipio, setMunicipio } = useCarrito();
  const [eligiendo, setEligiendo] = useState(false);   // HU-13b
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
            {/* HU-13b: municipio de entrega para calcular el envío (frame «2c · Detalle sin municipio») */}
            <button type="button" className="sitio-municipio" onClick={() => setEligiendo(true)}
              aria-label={municipio ? `Municipio de entrega: ${municipio}. Cambiar` : 'Elegir municipio de entrega'}>
              <img src="/img/iconos/ubicacion.svg" alt="" />
              <span className="sitio-municipio__largo">
                {municipio ? <>Entrega en {municipio} <span>· Cambiar</span></> : 'Elige municipio de entrega'}
              </span>
              <span className="sitio-municipio__corto">{municipio || 'Municipio'}</span>
            </button>
            <NavLink to="/" end className="sitio-nav__link">Catálogo<span className="sitio-nav__extra"> de maquinaria</span></NavLink>
            <NavLink to="/mi-cotizacion" className="sitio-nav__cotizacion">
              <img src="/img/iconos/cotizacion.svg" alt="" />
              Mi cotización
              {lineas.length > 0 && <span className={`sitio-nav__globo${salta ? ' salta' : ''}`} aria-label={`${lineas.length} equipos`}>{lineas.length}</span>}
            </NavLink>
          </nav>
        </div>
      </header>
      <ElegirMunicipio
        abierto={eligiendo} valor={municipio}
        onElegir={(m) => { setMunicipio(m); setEligiendo(false); }}
        onCerrar={() => setEligiendo(false)}
      />
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
