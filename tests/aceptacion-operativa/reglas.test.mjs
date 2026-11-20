import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOperation } from '../../compartido/operacion/operaciones.js';
import { etapas, etapaRenta, rentasEnEtapa } from '../../frontend/src/logica/flujo.js';
import { asignada, preparar } from './soporte/datos.mjs';

test('OP-02 | asignar varias unidades conserva folio, cantidades y cliente', () => {
  const data = asignada();
  assert.equal(data.rentals.length, 2);
  assert.equal(new Set(data.rentals.map(r => r.unit)).size, 2);
  assert.ok(data.rentals.every(r => r.cotizacionId === 1 && r.commercial === 'COT-0001'));
  assert.ok(data.rentals.every(r => r.status === 'Apartado' && r.client === 'Constructora del Norte'));
  assert.deepEqual(data.rentals.map(r => [r.start, r.end]), Array(2).fill(['2026-11-09', '2026-11-15']));
  assert.ok(data.units.every(u => u.state === 'Apartado'));
});

test('OP-03 | el avance de una unidad no modifica la segunda ni los datos de entrada', () => {
  const inicial = asignada();
  const copia = structuredClone(inicial);
  const listo = preparar(inicial);
  assert.deepEqual(inicial, copia);
  assert.deepEqual(listo.rentals[1], inicial.rentals[1]);
  assert.deepEqual(listo.units[1], inicial.units[1]);
  assert.equal(listo.rentals[1].ready, false);
  assert.equal(rentasEnEtapa(listo, 'preparacion').length, 1);
  assert.equal(rentasEnEtapa(listo, 'listos').length, 1);
});

test('OP-04 | cada renta pertenece a una sola etapa, incluyendo mantenimiento e historial', () => {
  const data = { rentals: [
    { status: 'Apartado' }, { status: 'En preparación', ready: false },
    { status: 'En preparación', ready: true }, { status: 'En renta' },
    { status: 'En revisión' }, { status: 'En mantenimiento' }, { status: 'Cerrada' },
  ] };
  const grupos = [...etapas.map(e => rentasEnEtapa(data, e.id)), rentasEnEtapa(data, 'historial')].flat();
  assert.equal(grupos.length, data.rentals.length);
  assert.equal(new Set(grupos).size, data.rentals.length);
  assert.deepEqual(data.rentals.map(r => etapaRenta(r).id), ['preparacion', 'preparacion', 'listos', 'rentas', 'revision', 'mantenimiento', 'historial']);
});

test('OP-05 | bloquear entrega antes de confirmar preparación sin alterar datos', () => {
  const data = asignada();
  const copia = structuredClone(data);
  assert.throws(() => applyOperation(data, 'R-001', 'deliver', { date: '2026-11-09', receiver: 'Cliente' }));
  assert.deepEqual(data, copia);
  const enProceso = preparar(data, 'progress');
  assert.throws(() => applyOperation(enProceso, 'R-001', 'deliver', { date: '2026-11-09', receiver: 'Cliente' }), /listo/);
  assert.equal(enProceso.rentals[0].status, 'En preparación');
});

test('OP-06 | confirmar preparación habilita la entrega sin efectuarla automáticamente', () => {
  const data = preparar(asignada());
  assert.equal(data.rentals[0].ready, true);
  assert.equal(data.rentals[0].status, 'En preparación');
  assert.equal(data.units[0].state, 'En preparación');
  assert.equal(etapaRenta(data.rentals[0]).id, 'listos');
  assert.equal(data.rentals[0].delivery, undefined);
  const entregada = applyOperation(data, 'R-001', 'deliver', { date: '2026-11-09', receiver: 'Cliente' });
  assert.equal(etapaRenta(entregada.rentals[0]).id, 'rentas');
});

test('OP-07 | mantenimiento bloquea entrega y permite retomar preparación con nueva revisión', () => {
  let data = preparar(asignada(), 'maintenance');
  assert.equal(etapaRenta(data.rentals[0]).id, 'mantenimiento');
  assert.throws(() => applyOperation(data, 'R-001', 'deliver', { date: '2026-11-09', receiver: 'Cliente' }));
  assert.throws(() => applyOperation(data, 'R-001', 'prepare', { result: 'ready' }));
  data = preparar(data, 'progress');
  assert.equal(etapaRenta(data.rentals[0]).id, 'preparacion');
  assert.equal(data.units[0].state, 'En preparación');
  assert.equal(data.rentals[0].ready, false);
  assert.equal(data.rentals[0].delivery, undefined);
});

test('OP-11 | rechazar devolución anterior a entrega y aceptar devolución el mismo día', () => {
  const data = applyOperation(preparar(asignada()), 'R-001', 'deliver', { date: '2026-11-10', receiver: 'Cliente' });
  const copia = structuredClone(data);
  assert.throws(() => applyOperation(data, 'R-001', 'return', { date: '2026-11-09', receiver: 'Almacén' }), /anterior/);
  assert.deepEqual(data, copia);
  const devuelta = applyOperation(data, 'R-001', 'return', { date: '2026-11-10', receiver: 'Almacén' });
  assert.equal(devuelta.rentals[0].status, 'En revisión');
  assert.equal(devuelta.units[0].state, 'En revisión');
});
