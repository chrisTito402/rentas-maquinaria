// Sondeos exploratorios reproducibles. No incrementan los 15 casos de aceptación.
import { mkdirSync, writeFileSync } from 'node:fs';
import { applyOperation } from '../../compartido/operacion/operaciones.js';
import { validarFoto } from '../../backend/src/foto.js';
import { asignarUnidades } from '../../backend/src/reservaciones.js';
import { asignada, preparar, estadoPara, cotizacion } from './soporte/datos.mjs';

const observaciones = [];
function rechazo(id, pregunta, accion) {
  try { accion(); observaciones.push({ id, pregunta, resultado: 'No rechazó la entrada', estado: 'revisar' }); }
  catch (error) { observaciones.push({ id, pregunta, resultado: error.message, estado: 'rechazo observado' }); }
}
rechazo('EXP-01', '¿Se detecta una unidad repetida con distinto uso de espacios y mayúsculas?', () =>
  asignarUnidades({ units: [], rentals: [] }, cotizacion(), ['mc-01', ' MC-01 ']));
rechazo('EXP-02', '¿Se bloquea reutilizar una unidad ya apartada?', () =>
  asignarUnidades(asignada(), { ...cotizacion(), id: 2, folio: 'COT-0002' }, ['MC-01', 'MC-03']));
rechazo('EXP-03', '¿Se bloquea registrar dos veces la entrega?', () =>
  applyOperation(estadoPara('entregada'), 'R-001', 'deliver', { date: '2026-11-09', receiver: 'Cliente' }));
rechazo('EXP-04', '¿La responsiva rechaza horómetro negativo?', () =>
  applyOperation(preparar(asignada()), 'R-001', 'document', { hours: '-1' }));
rechazo('EXP-05', '¿La foto rechaza un tipo que no sea imagen admitida?', () =>
  applyOperation(asignada(), 'R-001', 'photo', { image: 'data:text/plain;base64,YQ==' }));
rechazo('EXP-06', '¿Se impide cerrar fuera de servicio sin identificar quién autorizó?', () =>
  applyOperation(estadoPara('devuelta'), 'R-001', 'close', { mechanic: 'Luis', notes: 'Daño', result: 'Fuera de servicio' }));
try {
  await validarFoto('data:image/png;base64,YQ==');
  observaciones.push({ id: 'EXP-07', estado: 'revisar', resultado: 'Se admitió una foto ilegible' });
} catch (error) {
  observaciones.push({ id: 'EXP-07', estado: 'rechazo observado', resultado: error.message });
}
const final = applyOperation(estadoPara('devuelta'), 'R-001', 'close', { mechanic: 'Luis', notes: 'Reparación pendiente', result: 'En mantenimiento' }, { by: 'mecanico-prueba', usuarioId: 2 });
observaciones.push({ id: 'EXP-08', pregunta: '¿Cerrar en mantenimiento libera la unidad como disponible?',
  resultado: { renta: final.rentals[0].status, unidad: final.units[0].state }, estado: 'comportamiento observado' });
observaciones.push({ id: 'EXP-09', pregunta: '¿El evento identifica la cuenta que inició sesión?',
  resultado: final.rentals[0].events.at(-1).by, estado: 'comportamiento observado',
  explicacion: 'La función conserva el autor proporcionado por el servidor.' });

mkdirSync(new URL('./resultados/', import.meta.url), { recursive: true });
writeFileSync(new URL('./resultados/exploracion.json', import.meta.url), JSON.stringify({
  fecha: new Date().toISOString(), entorno: 'Sondeos de lógica en memoria, sin PostgreSQL ni API HTTP', observaciones,
}, null, 2));
console.log(JSON.stringify(observaciones, null, 2));
