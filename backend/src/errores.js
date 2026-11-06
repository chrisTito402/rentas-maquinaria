// BASE · No se toca.
// throw errorHttp(404, 'Equipo no encontrado')  ->  responde { "error": "Equipo no encontrado" } con 404
export const errorHttp = (status, mensaje, extra = {}) =>
  Object.assign(new Error(mensaje), { status, extra });
