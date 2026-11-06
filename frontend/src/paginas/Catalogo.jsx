// Dueño: Héctor · HU-01a Ver catálogo de equipos (KAN-6)
// VERSIÓN FALSA. Héctor la reemplaza.
import { Link } from 'react-router-dom';
import Pendiente from '../componentes/Pendiente.jsx';

export default function Catalogo() {
  return (
    <Pendiente hu="HU-01a" titulo="Catálogo de equipos" duenio="Héctor">
      <Link to="/equipos/1">Ir a la ficha del equipo 1</Link>
    </Pendiente>
  );
}
