// BASE · No se toca. Encabezado y menú.
import { NavLink, Outlet } from 'react-router-dom';
import { useCarrito } from '../carrito/CarritoContext.jsx';

export default function Layout() {
  const { lineas } = useCarrito();
  return (
    <>
      <header className="encabezado">
        <div className="contenedor encabezado-fila">
          <NavLink to="/" className="marca">Renta de Maquinaria</NavLink>
          <nav aria-label="Navegación principal">
            <NavLink to="/" end>Catálogo</NavLink>
            <NavLink to="/mi-cotizacion">Mi cotización {lineas.length > 0 && <span className="globo">{lineas.length}</span>}</NavLink>
            <NavLink to="/gestion/inicio">Gestión</NavLink>
          </nav>
        </div>
      </header>
      <main className="contenedor">
        <Outlet />
      </main>
    </>
  );
}
