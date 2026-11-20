// Dueño: Chris · HU-02a Fechas ocupadas (KAN-9)
// Funciones puras para saber si un rango de fechas choca con los días en que un equipo ya está apartado.
// Las fechas son texto 'AAAA-MM-DD', así que se comparan como texto sin líos de zona horaria.
import { fecha } from './formato.js';

// Se cuentan el día de inicio y el de fin: 25–27 y 27–29 SÍ chocan; 25–27 y 28–30 no.
export const chocan = (a, b) => a.inicio <= b.fin && b.inicio <= a.fin;

// ocupados: [{ inicio, fin }] · regresa true si ese día está dentro de algún rango
export const estaOcupado = (dia, ocupados = []) => ocupados.some((o) => dia >= o.inicio && dia <= o.fin);

// linea: { fechaInicio, fechaFin } · regresa el primer rango ocupado con el que choca, o null
export const buscarChoque = (linea, ocupados = []) =>
  ocupados.find((o) => chocan({ inicio: linea.fechaInicio, fin: linea.fechaFin }, o)) || null;

export const mensajeChoque = (o) => `Este equipo ya está rentado del ${fecha(o.inicio)} al ${fecha(o.fin)}.`;

// '2026-10-20' -> '2026-10-19'
export function diaAnterior(iso) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Con un día de inicio elegido, hasta qué día se puede rentar antes de topar con un rango ocupado.
// regresa { hasta: '2026-10-19', rango: { inicio: '2026-10-20', fin: '2026-10-22' } } o null si no hay tope.
export function limiteFin(inicio, ocupados = []) {
  if (!inicio) return null;
  const siguiente = ocupados
    .filter((o) => o.inicio > inicio)
    .sort((a, b) => (a.inicio < b.inicio ? -1 : 1))[0];
  return siguiente ? { hasta: diaAnterior(siguiente.inicio), rango: siguiente } : null;
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const diaMes = (iso) => Number(iso.slice(8, 10));
const conMes = (iso) => `${diaMes(iso)} de ${MESES[Number(iso.slice(5, 7)) - 1]}`;

// Texto del frame «Ficha · Estado fechas ocupadas (HU-02a)»:
// 'Con inicio el 18 puedes rentar hasta el 19: del 20 al 22 ya está rentado.'
export function avisoLimite(inicio, ocupados = []) {
  const limite = limiteFin(inicio, ocupados);
  if (!limite) return '';
  const { rango, hasta } = limite;
  // Si todo cae en el mismo mes basta el número del día (como en el Figma); si no, se dice el mes.
  const mismoMes = [inicio, hasta, rango.inicio, rango.fin].every((d) => d.slice(0, 7) === inicio.slice(0, 7));
  const f = mismoMes ? diaMes : conMes;
  return `Con inicio el ${f(inicio)} puedes rentar hasta el ${f(hasta)}: del ${f(rango.inicio)} al ${f(rango.fin)} ya está rentado.`;
}
