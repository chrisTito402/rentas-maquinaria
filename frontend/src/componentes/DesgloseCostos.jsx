// Dueño: Chris · HU-13a Costo de la renta (KAN-10)
// VERSIÓN FALSA. Chris la reemplaza por la real.
// Uso: <DesgloseCostos lineas={[{ nombre, tarifaDia, cantidad, fechaInicio, fechaFin }]} />
import Pendiente from './Pendiente.jsx';

export default function DesgloseCostos({ lineas }) {
  return <Pendiente hu="HU-13a" titulo={`Costo de la renta (${lineas.length} equipo/s)`} duenio="Chris" />;
}
