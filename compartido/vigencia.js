// Dueña: Katia · A1 Vigencia de la cotización (ajuste de la re-presentación del Sprint 1)
// Una cotización vale 15 días naturales desde que el cliente la pide. Si para entonces
// no se confirmó, el sistema la pasa a «Vencida» y sus fechas quedan libres.

export const DIAS_VIGENCIA = 15;

// Fecha en que vence la cotización.
export function venceEl(creadaEn) {
  const fecha = new Date(creadaEn);
  fecha.setDate(fecha.getDate() + DIAS_VIGENCIA);
  return fecha;
}

// «5 de diciembre de 2026»
export const fechaVigencia = (creadaEn) =>
  venceEl(creadaEn).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
