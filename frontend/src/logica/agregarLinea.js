// Dueño: Héctor · HU-04 Ver detalle del equipo (KAN-8)
import { MAX_CANTIDAD } from '@compartido/constantes.js';

// lineas: lo que ya hay en "Mi cotización"   ·   nueva: { equipoId, ..., cantidad, fechaInicio, fechaFin }
// regresa: el nuevo arreglo de líneas. Si ya existe una línea del mismo equipo con las
// mismas fechas, suma la cantidad a esa línea (sin pasar de MAX_CANTIDAD).
export function agregarLinea(lineas, nueva) {
  const indice = lineas.findIndex(
    (linea) => linea.equipoId === nueva.equipoId
      && linea.fechaInicio === nueva.fechaInicio
      && linea.fechaFin === nueva.fechaFin,
  );
  if (indice === -1) return [...lineas, nueva];
  const actualizada = {
    ...lineas[indice],
    cantidad: Math.min(lineas[indice].cantidad + nueva.cantidad, MAX_CANTIDAD),
  };
  return lineas.map((linea, i) => (i === indice ? actualizada : linea));
}
