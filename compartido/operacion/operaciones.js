import { autorSinCuenta } from './registros.js';
import { trabajoAbierto, rentaVigente, fechaTrabajo } from './taller.js';

// Transiciones operativas de Delivery 1.
export const STATES = ['Disponible', 'Apartado', 'En preparación', 'En renta', 'En revisión', 'En mantenimiento', 'Fuera de servicio'];
export const INVENTORY = ['Torreta', 'Extintor', 'Espejo', 'Focos delanteros', 'Focos traseros', 'Tanque de gas', 'Alarma de reversa', 'Dos cuchillas'];

const camposVacios = Object.freeze({});
const hoy = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Hermosillo' });

export function applyOperation(data, id, action, fields = camposVacios, autor = autorSinCuenta) {
  const next = structuredClone(data);
  const renta = next.rentals.find(item => item.id === id);
  if (!renta) throw new Error('No se encontró la renta.');
  const unidad = next.units.find(item => item.id === renta.unit);
  if (!unidad) throw new Error('No se encontró el equipo.');

  const estadoAnterior = unidad.state;
  const at = new Date().toISOString();
  let mensaje;

  function exigir(campo, nombre) {
    if (!String(fields[campo] ?? '').trim()) throw new Error('Completa ' + nombre + '.');
  }

  function desde(...estados) {
    if (!estados.includes(renta.status)) throw new Error('La operación no está disponible en el estado actual.');
  }

  if (trabajoAbierto(unidad) && ['prepare', 'deliver', 'close'].includes(action)) {
    throw new Error('Termina el trabajo de taller antes de continuar.');
  }
  if (renta.status === 'Cancelada') throw new Error('Este apartado ya está cancelado.');
  switch (action) {
    case 'cancel':
      desde('Apartado', 'En preparación', 'En mantenimiento');
      exigir('notes', 'el motivo de cancelación');
      if (fields.confirm !== 'si') throw new Error('Confirma que deseas cancelar este apartado.');
      renta.cancelacion = { motivo: fields.notes.trim(), at, ...autor };
      renta.status = 'Cancelada';
      renta.ready = false;
      if (unidad.state !== 'En mantenimiento' && unidad.state !== 'Fuera de servicio') {
        unidad.state = next.rentals.find(r => r.unit === unidad.id && rentaVigente(r))?.status ?? 'Disponible';
      }
      mensaje = 'Apartado cancelado · ' + renta.cancelacion.motivo;
      break;
    case 'issue':
    case 'review': {
      if (action === 'issue') {
        desde('En renta');
        if (renta.delivery?.date && fields.date < renta.delivery.date) throw new Error('La falla debe ocurrir a partir de la entrega.');
      }
      if (!fechaTrabajo(fields.date) || fields.date > hoy()) throw new Error('Revisa la fecha de la falla o revisión.');
      exigir('mechanic', 'el nombre del mecánico');
      exigir('notes', 'la descripción');
      const registro = { fecha: fields.date, detalle: fields.notes.trim(), mecanico: fields.mechanic.trim(), at, ...autor };
      const fallas = renta.issues ??= [];
      if (action === 'issue') {
        fallas.push({ ...registro, id: String(fallas.length + 1), estado: 'Pendiente', revisiones: [] });
        mensaje = 'Falla reportada · ' + registro.detalle;
      } else {
        const falla = fallas.find(f => f.id === fields.issueId && f.estado === 'Pendiente');
        if (!falla || !['Pendiente', 'Resuelta', 'Taller'].includes(fields.result) ||
            fields.date < (falla.revisiones.at(-1)?.fecha ?? falla.fecha)) throw new Error('Revisa la falla, su fecha y el resultado.');
        falla.revisiones.push({ ...registro, resultado: fields.result });
        falla.estado = fields.result;
        mensaje = 'Revisión de falla · ' + fields.result;
      }
      break;
    }
    case 'prepare':
      desde('Apartado', 'En preparación', 'En mantenimiento');
      exigir('mechanic', 'quién revisó el equipo');
      exigir('notes', 'el resultado de la revisión');
      renta.status = unidad.state = fields.result === 'maintenance' ? 'En mantenimiento' : 'En preparación';
      renta.ready = fields.result === 'ready';
      renta.preparedBy = fields.mechanic;
      renta.preparation = fields.notes;
      renta.inventory = fields.inventory ?? renta.inventory ?? [];
      mensaje = renta.ready ? 'Preparación terminada. Equipo listo para entrega' : 'Revisión de preparación registrada';
      break;
    case 'document': {
      desde('En preparación');
      if (!renta.ready) throw new Error('Primero confirma que el equipo está listo para entrega.');
      exigir('hours', 'el horómetro');
      const horas = Number(fields.hours);
      if (!Number.isFinite(horas) || horas < 0) throw new Error('Revisa la lectura del horómetro.');
      unidad.brand = fields.brand?.trim() || unidad.brand || '';
      unidad.serial = fields.serial?.trim() || unidad.serial || '';
      renta.document = {
        folio: 'RESP-' + renta.id.slice(2),
        date: fields.date || hoy(),
        hours: horas,
        inventory: fields.inventory ?? renta.inventory ?? [],
        notes: fields.notes ?? '',
        direccionFiscal: fields.direccionFiscal?.trim() || renta.address || '',
        brand: unidad.brand,
        serial: unidad.serial,
      };
      mensaje = 'Carta responsiva generada';
      break;
    }
    case 'photo':
      if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(fields.image || '')
        || fields.image.length > 1100000) {
        throw new Error('Selecciona una fotografía válida.');
      }
      renta.documentPhoto = { image: fields.image, name: fields.name || 'Responsiva', date: fields.date || hoy() };
      mensaje = 'Fotografía de la responsiva guardada';
      break;
    case 'deliver':
      desde('En preparación');
      if (!renta.ready) throw new Error('El equipo debe estar listo antes de entregarlo.');
      exigir('date', 'la fecha de entrega');
      exigir('receiver', 'quién recibe el equipo');
      renta.delivery = { ...fields, at };
      renta.status = unidad.state = 'En renta';
      mensaje = 'Entrega registrada. Equipo en renta';
      break;
    case 'return':
      desde('En renta');
      exigir('date', 'la fecha de regreso');
      exigir('receiver', 'quién recibe el equipo');
      if (renta.delivery?.date && fields.date < renta.delivery.date) {
        throw new Error('La devolución no puede ser anterior a la entrega.');
      }
      renta.return = { ...fields, at };
      renta.status = 'En revisión';
      if (!trabajoAbierto(unidad)) unidad.state = 'En revisión';
      mensaje = 'Devolución registrada. Equipo en revisión';
      break;
    case 'close':
      desde('En revisión');
      exigir('mechanic', 'quién revisó el equipo');
      exigir('notes', 'el resultado de la revisión final');
      if (!['Disponible', 'En mantenimiento', 'Fuera de servicio'].includes(fields.result)) {
        throw new Error('Selecciona el estado final.');
      }
      if (fields.result === 'Fuera de servicio') exigir('authorization', 'quién autorizó el estado');
      renta.finalReview = { ...fields };
      if (fields.result === 'Disponible' && renta.issues?.some(i => ['Taller', 'Pendiente'].includes(i.estado))) throw new Error('Revisa las fallas abiertas antes de liberar la unidad.');
      unidad.state = fields.result;
      renta.status = 'Cerrada';
      mensaje = 'Revisión final registrada. Equipo ' + unidad.state.toLowerCase();
      break;
    default:
      throw new Error('Operación no reconocida.');
  }

  if (unidad.state !== estadoAnterior) {
    unidad.stateChangedAt = at;
    if (unidad.state === 'En mantenimiento') unidad.maintenanceStartedAt = at;
  }
  renta.events.push({ at, text: mensaje, ...autor });
  return next;
}

const estadoPorSeccion = {
  apartados: 'Apartado',
  preparacion: 'En preparación',
  rentas: 'En renta',
  revision: 'En revisión',
};

export function bucketRentals(data, seccion) {
  return data.rentals.filter(renta => renta.status === estadoPorSeccion[seccion]);
}
