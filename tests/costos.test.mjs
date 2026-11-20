import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularCostos, calcularEnvio, contarDias } from '../compartido/costos.js';

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

// HU-13b · Costo de envío por zona
const unDia = { tarifaDia: 1000, fechaInicio: '2026-11-23', fechaFin: '2026-11-23' };

test('el envío se cobra por unidad: 2 equipos a Navojoa son 2 envíos de zona 2', () => {
  const costos = calcularCostos([{ ...unDia, cantidad: 2 }], 'Navojoa');
  assert.equal(costos.zona, 2);
  assert.equal(costos.unidades, 2);
  assert.equal(costos.envio, 2400);
});

test('las unidades se suman entre todas las líneas', () => {
  const costos = calcularCostos([{ ...unDia, cantidad: 2 }, { ...unDia, cantidad: 1 }], 'Cajeme');
  assert.equal(costos.envio, 1500);   // 3 unidades × $500 de zona 1
});

test('cada zona usa su tarifa: zona 1 $500, zona 2 $1,200 y zona 3 $2,000', () => {
  assert.deepEqual(calcularEnvio('Cajeme', 1), { zona: 1, tarifa: 500, envio: 500 });
  assert.deepEqual(calcularEnvio('Navojoa', 1), { zona: 2, tarifa: 1200, envio: 1200 });
  assert.deepEqual(calcularEnvio('Guaymas', 1), { zona: 3, tarifa: 2000, envio: 2000 });
});

test('fuera de zona no se puede cotizar y se da el motivo', () => {
  const envio = calcularEnvio('Hermosillo', 1);
  assert.equal(envio.fueraDeZona, true);
  assert.match(envio.motivo, /Hermosillo/);
  const costos = calcularCostos([{ ...unDia, cantidad: 1 }], 'Hermosillo');
  assert.equal(costos.fueraDeZona, true);
  assert.equal(costos.envio, 0);
});

test('un municipio que no está en la lista no se puede cotizar', () => {
  assert.equal(calcularEnvio('Tijuana', 1).fueraDeZona, true);
});

test('total = renta + envío + IVA 16 % sobre los dos', () => {
  const costos = calcularCostos([{ ...unDia, cantidad: 2 }], 'Navojoa');
  assert.equal(costos.subtotal, 2000);
  assert.equal(costos.iva, 704);       // 16 % de (2000 + 2400)
  assert.equal(costos.total, 5104);
});

test('el total cambia al cambiar el municipio', () => {
  const lineas = [{ ...unDia, cantidad: 1 }];
  assert.ok(calcularCostos(lineas, 'Guaymas').total > calcularCostos(lineas, 'Cajeme').total);
});

test('sin municipio el envío es 0 y queda como en HU-13a', () => {
  const costos = calcularCostos([{ ...unDia, cantidad: 1 }]);
  assert.equal(costos.envio, 0);
  assert.equal(costos.fueraDeZona, false);
  assert.equal(costos.total, 1160);
});
