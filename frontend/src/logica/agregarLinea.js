// Dueño: Héctor · HU-04 Ver detalle del equipo (KAN-8)
// VERSIÓN FALSA: siempre agrega una línea nueva (no suma cantidades). Héctor la reemplaza.

// lineas: lo que ya hay en "Mi cotización"   ·   nueva: { equipoId, ..., cantidad, fechaInicio, fechaFin }
// regresa: el nuevo arreglo de líneas
export function agregarLinea(lineas, nueva) {
  return [...lineas, nueva];
}
