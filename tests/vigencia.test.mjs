import test from 'node:test';
import assert from 'node:assert/strict';
import { DIAS_VIGENCIA, venceEl, fechaVigencia } from '../compartido/vigencia.js';

// A1 · Vigencia de la cotización: 15 días naturales desde que el cliente la pide
test('A1 · la cotización vale 15 días naturales', () => {
  assert.equal(DIAS_VIGENCIA, 15);
  const vence = venceEl(new Date(2026, 10, 20, 10, 30));
  assert.equal(vence.getFullYear(), 2026);
  assert.equal(vence.getMonth(), 11);
  assert.equal(vence.getDate(), 5);
});

test('A1 · cuenta fines de semana y cambia de mes y de año', () => {
  const vence = venceEl(new Date(2026, 11, 25));
  assert.equal(`${vence.getFullYear()}-${vence.getMonth() + 1}-${vence.getDate()}`, '2027-1-9');
});

test('A1 · la fecha se muestra en español', () => {
  assert.equal(fechaVigencia(new Date(2026, 10, 20)), '5 de diciembre de 2026');
});
