// Dueño: Chris · HU-13a Costo de la renta (KAN-10)
import { IVA } from './constantes.js';

const MILISEGUNDOS_DIA = 24 * 60 * 60 * 1000;

function fechaUTC(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return NaN;
  const fecha = new Date(`${iso}T00:00:00.000Z`);
  if (!Number.isFinite(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== iso) return NaN;
  return fecha.getTime();
}

// contarDias('2026-10-14', '2026-10-16') -> 3
export function contarDias(fechaInicio, fechaFin) {
  const inicio = fechaUTC(fechaInicio);
  const fin = fechaUTC(fechaFin);
  if (!Number.isFinite(inicio) || !Number.isFinite(fin) || fin < inicio) return 0;
  return (fin - inicio) / MILISEGUNDOS_DIA + 1;
}

// lineas: [{ tarifaDia, cantidad, fechaInicio, fechaFin, ...lo que sea }]
// regresa: { lineas: [{ ...cada línea, dias, importe }], subtotal, iva, total }
export function calcularCostos(lineas = []) {
  let subtotalCentavos = 0;
  const calculadas = lineas.map((linea) => {
    const dias = contarDias(linea.fechaInicio, linea.fechaFin);
    const tarifa = Number(linea.tarifaDia);
    const cantidad = Number(linea.cantidad);
    // Los centavos enteros evitan acumular errores decimales en los totales.
    const tarifaCentavos = Number.isFinite(tarifa) && tarifa >= 0
      ? Math.round((tarifa + Number.EPSILON) * 100)
      : 0;
    const importeCentavos = Number.isInteger(cantidad) && cantidad > 0
      ? tarifaCentavos * dias * cantidad
      : 0;
    subtotalCentavos += importeCentavos;
    return { ...linea, dias, importe: importeCentavos / 100 };
  });
  const ivaCentavos = Math.round(subtotalCentavos * IVA);
  return {
    lineas: calculadas,
    subtotal: subtotalCentavos / 100,
    iva: ivaCentavos / 100,
    total: (subtotalCentavos + ivaCentavos) / 100,
  };
}
