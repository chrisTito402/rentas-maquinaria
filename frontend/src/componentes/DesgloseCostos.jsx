// Dueño: Chris · HU-13a Costo de la renta (KAN-10)
// Uso: <DesgloseCostos lineas={[{ nombre, tarifaDia, cantidad, fechaInicio, fechaFin }]} />
import { calcularCostos } from '@compartido/costos.js';
import { dinero, fecha } from '@compartido/formato.js';

export default function DesgloseCostos({ lineas = [] }) {
  const costos = calcularCostos(lineas);
  return (
    <section className="panel" aria-label="Costo de la renta">
      <h2>Costo de la renta</h2>
      {costos.lineas.length === 0 && <p className="tenue">No hay equipos en la cotización.</p>}
      <table className="desglose" aria-label="Desglose de costos">
        <tbody>
          {costos.lineas.map((linea, indice) => (
            <tr key={indice}>
              <td>
                <strong>{linea.nombre || `Equipo ${linea.equipoId ?? indice + 1}`}</strong>
                <p className="tenue">{fecha(linea.fechaInicio)} al {fecha(linea.fechaFin)}</p>
                <p className="tenue">
                  {linea.cantidad} × {linea.dias} {linea.dias === 1 ? 'día' : 'días'} × {dinero(linea.tarifaDia)} / día
                </p>
                {linea.dias === 0 && <p className="error">Elige fechas válidas para calcular la renta.</p>}
              </td>
              <td>{linea.dias > 0 ? dinero(linea.importe) : '—'}</td>
            </tr>
          ))}
          <tr><td>Subtotal</td><td>{dinero(costos.subtotal)}</td></tr>
          <tr><td>IVA (16 %)</td><td>{dinero(costos.iva)}</td></tr>
          <tr className="total"><td>Total con IVA</td><td aria-live="polite">{dinero(costos.total)}</td></tr>
        </tbody>
      </table>
    </section>
  );
}
