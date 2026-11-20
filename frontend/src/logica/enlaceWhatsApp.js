import { dinero } from '@compartido/formato.js';

// Solo prepara el chat; el personal comercial adjunta el PDF descargado manualmente.
export function enlaceWhatsApp(cotizacion) {
  const telefono = String(cotizacion?.cliente?.telefono ?? '').replace(/\D/g, '');
  if (!/^[2-9]\d{9}$/.test(telefono)) return null;
  const nombre = String(cotizacion?.cliente?.nombre ?? '').trim();
  const mensaje = `Hola ${nombre}, le comparto la cotización ${cotizacion.folio} por ${dinero(cotizacion.total)}. Adjunto el PDF con equipos, fechas y desglose para su revisión.`;
  return `https://wa.me/52${telefono}?text=${encodeURIComponent(mensaje)}`;
}
