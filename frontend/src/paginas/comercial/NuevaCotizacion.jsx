// Dueño: Katia · HU-05 Crear cotización desde el panel (KAN-13)
// Diseño: frames «4 · Nueva cotización (panel)» y «4b · Nueva cotización: elegir fechas» del Figma.
// La ruta /comercial/cotizaciones/nueva ya está registrada en App.jsx. Por ahora es un aviso.
import { Link } from 'react-router-dom';
import ProximoSprint from '../../componentes/ProximoSprint.jsx';

export default function NuevaCotizacion() {
  return (
    <>
      <p><Link to="/comercial/cotizaciones">← Volver a cotizaciones</Link></p>
      <ProximoSprint hu="HU-05" kan="KAN-13" titulo="Nueva cotización desde el panel" duenio="Katia">
        Aquí se capturan las cotizaciones de los clientes que llaman o vienen en persona.
      </ProximoSprint>
    </>
  );
}
