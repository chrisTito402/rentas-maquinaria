import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularCostos, contarDias } from '../compartido/costos.js';

// HU-13a · Costo de la renta
test('se cuentan el día de inicio y el de fin (del 14 al 16 son 3 días)', () => {
  assert.equal(contarDias('2026-10-14', '2026-10-16'), 3);
  assert.equal(contarDias('2026-10-14', '2026-10-14'), 1);
});

test('fechas al revés o inválidas dan 0 días', () => {
  assert.equal(contarDias('2026-10-16', '2026-10-14'), 0);
  assert.equal(contarDias('2026-02-30', '2026-03-02'), 0);
  assert.equal(contarDias('', '2026-10-14'), 0);
});

test('importe por equipo = tarifa por día × días × cantidad', () => {
  const { lineas } = calcularCostos([
    { tarifaDia: 6800, cantidad: 1, fechaInicio: '2026-10-12', fechaFin: '2026-10-16' },
    { tarifaDia: 1200, cantidad: 2, fechaInicio: '2026-10-12', fechaFin: '2026-10-14' },
  ]);
  assert.equal(lineas[0].dias, 5);
  assert.equal(lineas[0].importe, 34000);
  assert.equal(lineas[1].importe, 7200);
});

test('se muestra el IVA del 16 % y el total con IVA', () => {
  // Ejemplo COT-0002: excavadora y minicargador 5 días
  const costos = calcularCostos([
    { tarifaDia: 6800, cantidad: 1, fechaInicio: '2026-10-12', fechaFin: '2026-10-16' },
    { tarifaDia: 2900, cantidad: 1, fechaInicio: '2026-10-12', fechaFin: '2026-10-16' },
  ]);
  assert.equal(costos.subtotal, 48500);
  assert.equal(costos.iva, 7760);
  assert.equal(costos.total, 56260);
});

test('el total se recalcula al cambiar cantidades o fechas', () => {
  const linea = { tarifaDia: 1450, cantidad: 1, fechaInicio: '2026-10-12', fechaFin: '2026-10-13' };
  const antes = calcularCostos([linea]).total;
  assert.ok(calcularCostos([{ ...linea, cantidad: 3 }]).total > antes);
  assert.ok(calcularCostos([{ ...linea, fechaFin: '2026-10-20' }]).total > antes);
});

test('los centavos no acumulan errores de decimales', () => {
  const costos = calcularCostos([{ tarifaDia: 0.1, cantidad: 3, fechaInicio: '2026-10-12', fechaFin: '2026-10-12' }]);
  assert.equal(costos.subtotal, 0.3);
});
