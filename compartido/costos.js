// Dueño: Chris · HU-13a Costo de la renta (KAN-10) y HU-13b Costo de envío por zona (KAN-53)
import { IVA, ZONAS_ENVIO, KM_MUNICIPIO } from './constantes.js';

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

// HU-13b · El envío se cobra por cada unidad (2 montacargas = 2 envíos), según la zona del municipio.
// calcularEnvio('Navojoa', 2)    -> { zona: 2, tarifa: 1200, envio: 2400 }
// calcularEnvio('Hermosillo', 1) -> { fueraDeZona: true, motivo: 'No entregamos en Hermosillo: …' }
export function calcularEnvio(municipio, unidades) {
  const km = KM_MUNICIPIO[municipio];
  if (km === undefined) return { fueraDeZona: true, motivo: 'Elige el municipio de entrega.' };
  const zona = ZONAS_ENVIO.find((z) => km <= z.hastaKm);
  if (!zona) {
    const limite = ZONAS_ENVIO[ZONAS_ENVIO.length - 1].hastaKm;
    return { fueraDeZona: true, motivo: `No entregamos en ${municipio}: está a más de ${limite} km del patio en Cd. Obregón.` };
  }
  const n = Number.isInteger(unidades) && unidades > 0 ? unidades : 0;
  return { zona: zona.zona, tarifa: zona.tarifa, envio: zona.tarifa * n };
}

// lineas: [{ tarifaDia, cantidad, fechaInicio, fechaFin, ...lo que sea }]
// municipio (opcional, HU-13b): si viene, se suma el envío por unidad y el IVA va sobre renta + envío.
// regresa: { lineas: [{ ...cada línea, dias, importe }], subtotal, unidades, envio, zona,
//            fueraDeZona, motivo, iva, total }
// Sin municipio el envío es 0 y todo queda como en HU-13a.
export function calcularCostos(lineas = [], municipio) {
  let subtotalCentavos = 0;
  let unidades = 0;
  const calculadas = lineas.map((linea) => {
    const dias = contarDias(linea.fechaInicio, linea.fechaFin);
    const tarifa = Number(linea.tarifaDia);
    const cantidad = Number(linea.cantidad);
    // Los centavos enteros evitan acumular errores decimales en los totales.
    const tarifaCentavos = Number.isFinite(tarifa) && tarifa >= 0
      ? Math.round((tarifa + Number.EPSILON) * 100)
      : 0;
    const valida = Number.isInteger(cantidad) && cantidad > 0;
    const importeCentavos = valida ? tarifaCentavos * dias * cantidad : 0;
    if (valida) unidades += cantidad;
    subtotalCentavos += importeCentavos;
    return { ...linea, dias, importe: importeCentavos / 100 };
  });
  const envio = municipio ? calcularEnvio(municipio, unidades) : { envio: 0 };
  const envioCentavos = envio.fueraDeZona ? 0 : Math.round((envio.envio + Number.EPSILON) * 100);
  const ivaCentavos = Math.round((subtotalCentavos + envioCentavos) * IVA);
  return {
    lineas: calculadas,
    subtotal: subtotalCentavos / 100,
    unidades,
    envio: envioCentavos / 100,
    zona: envio.zona ?? null,
    fueraDeZona: Boolean(envio.fueraDeZona),
    motivo: envio.motivo ?? '',
    iva: ivaCentavos / 100,
    total: (subtotalCentavos + envioCentavos + ivaCentavos) / 100,
  };
}
