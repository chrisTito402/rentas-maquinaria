import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOperation } from '../compartido/operacion/operaciones.js';
import { asignarUnidades } from '../backend/src/reservaciones.js';
import { etapas, etapaRenta, rentasEnEtapa } from '../frontend/src/logica/flujo.js';

function asignada() {
  return asignarUnidades({ units: [], rentals: [] }, {
    id: 1, folio: 'COT-0001', cliente: { nombre: 'Cliente', telefono: '6621234567', correo: 'cliente@example.com', direccion: 'Obra', municipio: 'Hermosillo' },
    lineas: [{ equipoId: 1, equipo: 'Montacargas', modelo: 'M1', tipo: 'Carga', cantidad: 2, inicio: '2026-11-09', fin: '2026-11-15' }],
  }, ['MC-01', 'MC-02']);
}
const preparar = (data, result = 'ready') => applyOperation(data, 'R-001', 'prepare', { mechanic: 'Mecánico', notes: 'Revisión registrada', result });

test('una cotización con varias unidades conserva su folio y permite avances independientes', () => {
  const inicial = asignada();
  const listo = preparar(inicial);
  assert.equal(inicial.rentals[0].status, 'Apartado');
  assert.equal(listo.rentals[1].ready, false);
  assert.equal(rentasEnEtapa(listo, 'preparacion').length, 1);
  assert.equal(rentasEnEtapa(listo, 'listos').length, 1);
  assert.ok(listo.rentals.every(r => r.cotizacionId === 1 && r.commercial === 'COT-0001'));
});

test('cada unidad pertenece a una única etapa, incluyendo mantenimiento e historial', () => {
  const data = { rentals: [
    { status: 'Apartado' }, { status: 'En preparación', ready: false },
    { status: 'En preparación', ready: true }, { status: 'En renta' },
    { status: 'En revisión' }, { status: 'En mantenimiento' }, { status: 'Cerrada' },
  ] };
  const grupos = [...etapas.map(e => rentasEnEtapa(data, e.id)), rentasEnEtapa(data, 'historial')].flat();
  assert.equal(grupos.length, data.rentals.length);
  assert.equal(new Set(grupos).size, data.rentals.length);
});

test('recorrido de asignación, preparación, responsiva, entrega, devolución y cierre', () => {
  let data = asignada();
  assert.throws(() => applyOperation(data, 'R-001', 'deliver', { date: '2026-11-09', receiver: 'Cliente' }));
  data = preparar(data);
  data = applyOperation(data, 'R-001', 'document', { hours: '10', inventory: ['Extintor'] });
  data = applyOperation(data, 'R-001', 'deliver', { date: '2026-11-09', receiver: 'Cliente' });
  assert.equal(etapaRenta(data.rentals[0]).id, 'rentas');
  data = applyOperation(data, 'R-001', 'return', { date: '2026-11-15', receiver: 'Almacén' });
  assert.equal(etapaRenta(data.rentals[0]).id, 'revision');
  data = applyOperation(data, 'R-001', 'close', { mechanic: 'Mecánico', notes: 'Revisado', result: 'Disponible' });
  assert.equal(etapaRenta(data.rentals[0]).id, 'historial');
  assert.equal(data.units[0].state, 'Disponible');
  assert.equal(data.rentals[0].document.hours, 10);
  assert.equal(data.rentals[0].events.length, 6);
});

test('mantenimiento impide entregar y permite retomar la preparación con una nueva revisión', () => {
  let data = preparar(asignada(), 'maintenance');
  assert.equal(etapaRenta(data.rentals[0]).id, 'mantenimiento');
  assert.throws(() => applyOperation(data, 'R-001', 'deliver', { date: '2026-11-09', receiver: 'Cliente' }));
  assert.throws(() => applyOperation(data, 'R-001', 'prepare', { result: 'ready' }));
  data = preparar(data, 'progress');
  assert.equal(etapaRenta(data.rentals[0]).id, 'preparacion');
  assert.equal(data.units[0].state, 'En preparación');
});

test('rechaza devolución anterior a la entrega y permite devolución el mismo día', () => {
  const data = applyOperation(preparar(asignada()), 'R-001', 'deliver', { date: '2026-11-10', receiver: 'Cliente' });
  assert.throws(() => applyOperation(data, 'R-001', 'return', { date: '2026-11-09', receiver: 'Almacén' }), /anterior/);
  assert.equal(data.rentals[0].status, 'En renta');
  assert.equal(applyOperation(data, 'R-001', 'return', { date: '2026-11-10', receiver: 'Almacén' }).rentals[0].status, 'En revisión');
});
