// Dueño: Chris · HU-13a Costo de la renta (KAN-10) y HU-13b Costo de envío por zona (KAN-53)
// Uso: <DesgloseCostos lineas={[{ nombre, tarifaDia, cantidad, fechaInicio, fechaFin }]} municipio="Navojoa" />
//      Sin la prop municipio no se muestra el envío (por ejemplo en la ficha del equipo).
//      Con municipio="" se muestra que el envío se calcula al elegir el municipio.
// Diseño: desglose de «2 · Detalle del equipo» y «3 · Solicitud de cotización» del Figma.
import { calcularCostos } from '@compartido/costos.js';
import { dinero } from '@compartido/formato.js';

export default function DesgloseCostos({ lineas = [], detalle = false, municipio }) {
  const conEnvio = municipio !== undefined;
  const costos = calcularCostos(lineas, municipio || undefined);
  const linea = costos.lineas[0];
  const unidades = `${costos.unidades} ${costos.unidades === 1 ? 'unidad' : 'unidades'}`;
  return (
    <div className="f-desglose" aria-label="Desglose de costos">
      {detalle && linea && (
        <div className="f-desglose__fila">
          <span>Subtotal ({linea.dias} {linea.dias === 1 ? 'día' : 'días'} × {linea.cantidad > 1 ? `${linea.cantidad} × ` : ''}{dinero(linea.tarifaDia)})</span>
          <strong>{dinero(linea.importe)}</strong>
        </div>
      )}
      {!detalle && (
        <div className="f-desglose__fila"><span>Subtotal de renta</span><strong>{dinero(costos.subtotal)}</strong></div>
      )}
      {conEnvio && !municipio && (
        <div className="f-desglose__fila"><span>Envío</span><span className="f-campo__ayuda">Elige el municipio de entrega</span></div>
      )}
      {conEnvio && municipio && !costos.fueraDeZona && (
        <div className="f-desglose__fila">
          <span>Envío a {municipio} (zona {costos.zona} · {unidades})</span>
          <strong>{dinero(costos.envio)}</strong>
        </div>
      )}
      {conEnvio && costos.fueraDeZona && (
        <p className="f-alerta f-alerta--error" role="alert">{costos.motivo}</p>
      )}
      <div className="f-desglose__fila"><span>IVA (16 %)</span><strong>{dinero(costos.iva)}</strong></div>
      <div className="f-desglose__total">
        <span>Total con IVA{!detalle && <small>{conEnvio && municipio && !costos.fueraDeZona ? 'Incluye la renta, el envío e IVA.' : 'Incluye la renta e IVA.'}</small>}</span>
        <strong aria-live="polite">{dinero(costos.total)}</strong>
      </div>
    </div>
  );
}
