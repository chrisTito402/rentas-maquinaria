import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import GestionLayout from './componentes/GestionLayout.jsx';
import Layout from './componentes/Layout.jsx';
import Catalogo from './paginas/Catalogo.jsx';
import DetalleEquipo from './paginas/DetalleEquipo.jsx';
import MiCotizacion from './paginas/MiCotizacion.jsx';
import Operacion from './paginas/operacion/FlujoOperacion.jsx';
import CotizacionesComercial from './paginas/comercial/Cotizaciones.jsx';
import DetalleCotizacionComercial from './paginas/comercial/DetalleCotizacion.jsx';

function RutaAnterior({ comercial = false }) {
  const { seccion, id } = useParams();
  const destino = comercial ? `cotizaciones${id ? '/' + id : ''}`
    : ({ inicio: 'inicio', equipos: 'inventario', registros: 'historial', historial: 'historial', apartados: 'operacion/por-asignar' }[seccion] || (['preparacion', 'rentas', 'revision', 'mantenimiento'].includes(seccion) ? 'operacion/' + seccion : 'inicio'));
  return <Navigate to={'/gestion/' + destino} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/gestion" element={<GestionLayout />}>
        <Route index element={<Navigate to="inicio" replace />} />
        <Route path="inicio" element={<Operacion vista="inicio" />} />
        <Route path="cotizaciones" element={<CotizacionesComercial />} />
        <Route path="cotizaciones/:id" element={<DetalleCotizacionComercial />} />
        <Route path="operacion" element={<Navigate to="por-asignar" replace />} />
        <Route path="operacion/:seccion" element={<Operacion />} />
        <Route path="rentas/:rentaId" element={<Operacion vista="detalle" />} />
        <Route path="inventario" element={<Operacion vista="equipos" />} />
        <Route path="historial" element={<Operacion vista="historial" />} />
        <Route path="*" element={<><h1>Página no encontrada</h1><Navigate to="/gestion/inicio" replace /></>} />
      </Route>
      <Route path="/comercial" element={<Navigate to="/gestion/cotizaciones" replace />} />
      <Route path="/comercial/cotizaciones/:id?" element={<RutaAnterior comercial />} />
      <Route path="/admin/:seccion?" element={<RutaAnterior />} />
      <Route path="/panel/cotizaciones/:id?" element={<RutaAnterior comercial />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Catalogo />} />
        <Route path="/equipos/:id" element={<DetalleEquipo />} />
        <Route path="/mi-cotizacion" element={<MiCotizacion />} />
        <Route path="*" element={<p>Página no encontrada.</p>} />
      </Route>
    </Routes>
  );
}
