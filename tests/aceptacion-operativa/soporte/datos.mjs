import { asignarUnidades } from '../../../backend/src/reservaciones.js';
import { applyOperation } from '../../../compartido/operacion/operaciones.js';

export const cotizacion = () => ({
  id: 1, folio: 'COT-0001', cliente: {
    nombre: 'Constructora del Norte', telefono: '6621234567', correo: 'obra@example.com',
    direccion: 'Avenida principal 10', municipio: 'Hermosillo', empresa: 'Obras del Norte',
  },
  lineas: [{ id: 1, equipoId: 1, equipo: 'Montacargas', modelo: 'M1', tipo: 'Carga', cantidad: 2,
    inicio: '2026-11-09', fin: '2026-11-15', fechaInicio: '2026-11-09', fechaFin: '2026-11-15',
    dias: 7, tarifaDia: 100, importe: 1400 }],
  subtotal: 1400, iva: 224, total: 1624, origen: 'Web', estado: 'Pendiente', creadaEn: '2026-11-09T12:00:00Z',
});
export const asignada = () => asignarUnidades({ units: [], rentals: [] }, cotizacion(), ['MC-01', 'MC-02']);
export const preparar = (data, result = 'ready') => applyOperation(data, 'R-001', 'prepare', {
  mechanic: 'Luis', notes: 'Revisión registrada', result,
});
export function estadoPara(etapa = 'asignada') {
  let data = asignada();
  if (etapa === 'asignada') return data;
  data = preparar(data);
  if (etapa === 'lista') return data;
  data = applyOperation(data, 'R-001', 'document', { hours: '10', inventory: ['Extintor'] });
  data = applyOperation(data, 'R-001', 'deliver', { date: '2026-11-09', receiver: 'Cliente' });
  if (etapa === 'entregada') return data;
  if (etapa !== 'devuelta') throw new Error('Etapa de prueba no reconocida.');
  return applyOperation(data, 'R-001', 'return', { date: '2026-11-15', receiver: 'Almacén' });
}
