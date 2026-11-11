// Dueño: Chris · HU-13a Costo de la renta (KAN-10)
// Uso: <DesgloseCostos lineas={[{ nombre, tarifaDia, cantidad, fechaInicio, fechaFin }]} />
// Diseño: desglose de «2 · Detalle del equipo» y «3 · Solicitud de cotización» del Figma.
import { calcularCostos } from '@compartido/costos.js';
import { dinero } from '@compartido/formato.js';

export default function DesgloseCostos({ lineas = [], detalle = false }) {
  const costos = calcularCostos(lineas);
  const linea = costos.lineas[0];
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
      <div className="f-desglose__fila"><span>IVA (16 %)</span><strong>{dinero(costos.iva)}</strong></div>
      <div className="f-desglose__total">
        <span>Total con IVA{!detalle && <small>Incluye la renta e IVA.</small>}</span>
        <strong aria-live="polite">{dinero(costos.total)}</strong>
      </div>
    </div>
  );
}
