export const rentaVigente = renta => !['Cancelada', 'Cerrada'].includes(renta.status);
export const trabajoAbierto = unidad => unidad.taller?.find(orden => orden.estado === 'En taller');
export const chocaPreventivo = (unidad, inicio, fin) => unidad.taller?.some(orden =>
  orden.estado === 'Programado' && inicio <= orden.fecha && orden.fecha <= fin);
export function fechaTrabajo(fecha) {
  return typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
    Number.isFinite(Date.parse(fecha)) && new Date(fecha).toISOString().slice(0, 10) === fecha;
}
function exigirTexto(valor, campo) {
  if (typeof valor !== 'string' || !valor.trim() || valor.length > 2000) throw new Error('Revisa ' + campo + '.');
  return valor.trim();
}

export function aplicarTaller(data, id, accion, campos, autor) {
  const next = structuredClone(data);
  const unidad = next.units.find(u => u.id === id);
  if (!unidad) throw new Error('No encontramos esa unidad.');
  const ordenes = unidad.taller ??= [];
  const activa = next.rentals.find(r => r.unit === id && rentaVigente(r));
  const orden = trabajoAbierto(unidad);
  const at = new Date().toISOString();
  const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Hermosillo' });
  const fecha = campos.date;
  if (!fechaTrabajo(fecha)) throw new Error('Indica una fecha válida.');
  if (accion !== 'programar' && fecha > hoy) throw new Error('La fecha del trabajo todavía no llega.');
  const detalle = exigirTexto(campos.notes, 'el motivo o resultado');
  const evento = { fecha, detalle, at, ...autor };
  let texto;
  switch (accion) {
    case 'programar':
      if (fecha < hoy || chocaPreventivo(unidad, fecha, fecha) ||
          next.rentals.some(r => r.unit === id && rentaVigente(r) && r.start <= fecha && fecha <= r.end)) {
        throw new Error('La fecha ya pasó o la unidad ya está ocupada ese día.');
      }
      ordenes.push({ ...evento, estado: 'Programado', trabajos: [] });
      texto = 'Preventivo programado';
      break;
    case 'ingresar': {
      if (orden || unidad.state === 'Fuera de servicio') throw new Error('Revisa el estado del equipo antes del ingreso.');
      if (activa?.status === 'En renta' && !activa.issues?.some(i => i.estado === 'Taller')) throw new Error('Registra primero la falla y su envío a taller.');
      const plan = campos.plan ? ordenes.find(o => o.at === campos.plan && o.estado === 'Programado') : null;
      if (campos.plan && !plan) throw new Error('Ese preventivo ya cambió, vuelve a abrir la ficha.');
      if (plan) Object.assign(plan, { estado: 'En taller', ingreso: evento });
      else ordenes.push({ ...evento, estado: 'En taller', ingreso: evento, trabajos: [] });
      unidad.state = 'En mantenimiento';
      unidad.maintenanceStartedAt = at;
      if (activa && ['Apartado', 'En preparación'].includes(activa.status)) { activa.status = 'En mantenimiento'; activa.ready = false; }
      texto = 'Ingreso a taller';
      break;
    }
    case 'trabajo':
    case 'liberar':
      if (!orden || fecha < (orden.trabajos.at(-1)?.fecha ?? orden.ingreso.fecha)) throw new Error('Revisa el ingreso a taller y la fecha del último trabajo.');
      if (accion === 'trabajo') {
        orden.trabajos.push({ ...evento, mecanico: exigirTexto(campos.mechanic, 'quién hizo el trabajo'), resultado: exigirTexto(campos.result, 'el resultado') });
        texto = 'Trabajo de taller registrado';
      } else {
        if (!orden.trabajos.length) throw new Error('Registra el trabajo realizado antes de liberar el equipo.');
        orden.salida = { ...evento, mecanico: exigirTexto(campos.mechanic, 'quién revisó el trabajo') };
        orden.estado = 'Terminado';
        if (activa?.status === 'En mantenimiento') { activa.status = 'En preparación'; activa.ready = false; }
        unidad.state = activa?.status ?? 'Disponible';
        for (const r of next.rentals.filter(r => r.unit === id)) {
          for (const falla of r.issues ?? []) if (falla.estado === 'Taller') {
            falla.estado = 'Resuelta';
            (falla.revisiones ??= []).push({ ...orden.salida, resultado: 'Reparada en taller' });
          }
        }
        texto = 'Equipo liberado de taller';
      }
      break;
    default: throw new Error('Ese movimiento de taller no existe.');
  }
  if (unidad.state !== data.units.find(u => u.id === id).state) unidad.stateChangedAt = at;
  if (activa) activa.events.push({ at, text: texto + ' · ' + detalle, ...autor });
  return next;
}
