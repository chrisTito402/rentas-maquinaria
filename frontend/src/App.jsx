// BASE · No se toca. Todas las rutas del Sprint 1 ya están declaradas.
import { Routes, Route } from 'react-router-dom';
import Layout from './componentes/Layout.jsx';
import Catalogo from './paginas/Catalogo.jsx';                   // Héctor · HU-01a
import DetalleEquipo from './paginas/DetalleEquipo.jsx';         // Héctor · HU-04
import MiCotizacion from './paginas/MiCotizacion.jsx';           // Chris  · HU-14a
import PanelCotizaciones from './paginas/PanelCotizaciones.jsx'; // Katia  · HU-10
import DetalleCotizacion from './paginas/DetalleCotizacion.jsx'; // Katia  · HU-10

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Catalogo />} />
        <Route path="/equipos/:id" element={<DetalleEquipo />} />
        <Route path="/mi-cotizacion" element={<MiCotizacion />} />
        <Route path="/panel/cotizaciones" element={<PanelCotizaciones />} />
        <Route path="/panel/cotizaciones/:id" element={<DetalleCotizacion />} />
        <Route path="*" element={<p>Página no encontrada.</p>} />
      </Route>
    </Routes>
  );
}
