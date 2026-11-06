// Dueño: Héctor · HU-04 Ver detalle del equipo (KAN-8)
// VERSIÓN FALSA: trae un botón para meter una línea de prueba a "Mi cotización"
// (así Chris puede probar HU-14a antes de que esta HU esté lista). Héctor la reemplaza.
import { useParams } from 'react-router-dom';
import { useCarrito } from '../carrito/CarritoContext.jsx';
import Pendiente from '../componentes/Pendiente.jsx';

export default function DetalleEquipo() {
  const { id } = useParams();
  const { agregar } = useCarrito();
  const deprueba = () => agregar({
    equipoId: 1, nombre: 'Montacargas Toyota 8FG25', foto: 'https://placehold.co/480x300?text=Prueba',
    tarifaDia: 1200, cantidad: 2, fechaInicio: '2026-10-14', fechaFin: '2026-10-16',
  });
  return (
    <Pendiente hu="HU-04" titulo={`Ficha del equipo ${id}`} duenio="Héctor">
      <button onClick={deprueba}>Agregar línea de prueba (equipo 1 · 2 u. · 14 al 16 oct)</button>
    </Pendiente>
  );
}
