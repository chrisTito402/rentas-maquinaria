// Dueño: Héctor · HU-15a Aprobar cotización (KAN-15)
// VERSIÓN FALSA. Héctor la reemplaza.
// Uso: <BotonAprobar cotizacion={{ id, folio, estado }} onAprobada={(r) => ...} />
import Pendiente from './Pendiente.jsx';

export default function BotonAprobar({ cotizacion }) {
  return <Pendiente hu="HU-15a" titulo={`Botón Aprobar (estado: ${cotizacion.estado})`} duenio="Héctor" />;
}
