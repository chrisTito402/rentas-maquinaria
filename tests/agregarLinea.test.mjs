import test from 'node:test';
import assert from 'node:assert/strict';
import { agregarLinea } from '../frontend/src/logica/agregarLinea.js';

// HU-04 · Ver detalle del equipo (agregar a "Mi cotización")
const montacargas = { equipoId: 6, cantidad: 2, fechaInicio: '2026-10-12', fechaFin: '2026-10-15' };

test('agrega el equipo a "Mi cotización"', () => {
  assert.deepEqual(agregarLinea([], montacargas), [montacargas]);
});

test('si el mismo equipo ya está con las mismas fechas, se suma la cantidad', () => {
  const lineas = agregarLinea([montacargas], { ...montacargas, cantidad: 3 });
  assert.equal(lineas.length, 1);
  assert.equal(lineas[0].cantidad, 5);
});

test('el mismo equipo con otras fechas va en otra línea', () => {
  const lineas = agregarLinea([montacargas], { ...montacargas, fechaFin: '2026-10-20' });
  assert.equal(lineas.length, 2);
});

test('al sumar, la cantidad no pasa de 20', () => {
  const lineas = agregarLinea([{ ...montacargas, cantidad: 15 }], { ...montacargas, cantidad: 10 });
  assert.equal(lineas[0].cantidad, 20);
});

test('no modifica la lista original', () => {
  const original = [montacargas];
  agregarLinea(original, { ...montacargas, cantidad: 1 });
  assert.equal(original[0].cantidad, 2);
});
