import test from 'node:test';
import assert from 'node:assert/strict';
import { chocan, estaOcupado, buscarChoque, mensajeChoque } from '../compartido/ocupadas.js';

// HU-02a · Fechas ocupadas
const apartado = { inicio: '2026-11-25', fin: '2026-11-27' };

test('se cuentan el día de inicio y el de fin: compartir un día ya es choque', () => {
  assert.equal(chocan({ inicio: '2026-11-27', fin: '2026-11-29' }, apartado), true);
  assert.equal(chocan({ inicio: '2026-11-23', fin: '2026-11-25' }, apartado), true);
});

test('un rango que envuelve al apartado también choca', () => {
  assert.equal(chocan({ inicio: '2026-11-20', fin: '2026-11-30' }, apartado), true);
});

test('rangos pegados pero sin días en común no chocan', () => {
  assert.equal(chocan({ inicio: '2026-11-28', fin: '2026-11-30' }, apartado), false);
  assert.equal(chocan({ inicio: '2026-11-22', fin: '2026-11-24' }, apartado), false);
});

test('estaOcupado marca solo los días dentro de un rango apartado', () => {
  assert.equal(estaOcupado('2026-11-26', [apartado]), true);
  assert.equal(estaOcupado('2026-11-28', [apartado]), false);
  assert.equal(estaOcupado('2026-11-26', []), false);
});

test('buscarChoque regresa el rango con el que choca y el mensaje dice las fechas', () => {
  const choque = buscarChoque({ fechaInicio: '2026-11-24', fechaFin: '2026-11-26' }, [apartado]);
  assert.deepEqual(choque, apartado);
  assert.equal(mensajeChoque(choque), 'Este equipo ya está rentado del 25/11/2026 al 27/11/2026.');
  assert.equal(buscarChoque({ fechaInicio: '2026-12-01', fechaFin: '2026-12-02' }, [apartado]), null);
});
