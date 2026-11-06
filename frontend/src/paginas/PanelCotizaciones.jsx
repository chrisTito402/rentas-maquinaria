// Dueño: Katia · HU-10 Consultar cotizaciones (KAN-19)
// VERSIÓN FALSA. Katia la reemplaza.
import { Link } from 'react-router-dom';
import Pendiente from '../componentes/Pendiente.jsx';

export default function PanelCotizaciones() {
  return (
    <Pendiente hu="HU-10" titulo="Lista de cotizaciones" duenio="Katia">
      <Link to="/panel/cotizaciones/1">Ir al detalle de COT-0001</Link>
    </Pendiente>
  );
}
