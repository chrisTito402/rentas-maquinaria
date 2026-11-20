// Se conserva el nombre por compatibilidad con MiCotizacion; ahora comprueba si hay foto en BD.
export const tieneIlustracion = (equipo = {}) => typeof equipo.foto === 'string' && equipo.foto.trim().length > 0;

export function imagenEquipo(equipo = {}) {
  return tieneIlustracion(equipo) ? equipo.foto.trim() : '/img/iconos/logo.svg';
}

// 'Capacidad de carga 2.5 t · Gas LP · Elevación 4.80 m' -> ['Capacidad de carga 2.5 t', 'Gas LP', ...]
export function partesCaracteristicas(texto = '') {
  return String(texto).split('·').map((parte) => parte.trim()).filter(Boolean);
}
