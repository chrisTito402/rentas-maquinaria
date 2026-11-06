// Dueño: Chris · HU-14a Enviar solicitud de cotización (KAN-11)
// VERSIÓN FALSA. Chris la reemplaza.
import { useCarrito } from '../carrito/CarritoContext.jsx';
import Pendiente from '../componentes/Pendiente.jsx';

export default function MiCotizacion() {
  const { lineas } = useCarrito();
  return (
    <Pendiente hu="HU-14a" titulo="Mi cotización" duenio="Chris">
      <pre>{JSON.stringify(lineas, null, 2)}</pre>
    </Pendiente>
  );
}
