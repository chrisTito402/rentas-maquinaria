// Ilustraciones del prototipo de Figma para cada tipo de máquina.
// Si el equipo no coincide con ninguna, se usa la foto que trae la base de datos.
const ILUSTRACIONES = [
  [/el[eé]ctric/i, '/img/equipos/montacargas-electrico.png'],
  [/montacarga/i, '/img/equipos/montacargas-toyota.png'],
  [/retro/i, '/img/equipos/retroexcavadora.png'],
  [/excavadora/i, '/img/equipos/excavadora.png'],
  [/minicargador|bobcat/i, '/img/equipos/minicargador.png'],
  [/compactador|rodillo/i, '/img/equipos/compactador.png'],
  // Hechas por el equipo con el mismo estilo (no vienen en el Figma); fuentes en public/img/equipos/fuentes.
  [/plataforma|tijera|elevador/i, '/img/equipos/plataforma-tijera.png'],
  [/compresor/i, '/img/equipos/compresor.png'],
  [/generador|planta de luz/i, '/img/equipos/generador.png'],
];

const buscar = (equipo) => ILUSTRACIONES.find(([patron]) => patron.test(`${equipo.nombre ?? ''} ${equipo.tipo ?? ''}`));

export const tieneIlustracion = (equipo = {}) => Boolean(buscar(equipo));

export function imagenEquipo(equipo = {}) {
  const encontrada = buscar(equipo);
  return encontrada ? encontrada[1] : '/img/iconos/logo.svg';
}

// 'Capacidad de carga 2.5 t · Gas LP · Elevación 4.80 m' -> ['Capacidad de carga 2.5 t', 'Gas LP', ...]
export function partesCaracteristicas(texto = '') {
  return String(texto).split('·').map((parte) => parte.trim()).filter(Boolean);
}
