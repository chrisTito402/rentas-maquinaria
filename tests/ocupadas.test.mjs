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

test('con un inicio elegido, el rango se detiene el día antes del siguiente apartado', async () => {
  const { limiteFin, avisoLimite } = await import('../compartido/ocupadas.js');
  const ocupados = [{ inicio: '2026-10-20', fin: '2026-10-22' }, { inicio: '2026-10-28', fin: '2026-10-29' }];
  assert.deepEqual(limiteFin('2026-10-18', ocupados), { hasta: '2026-10-19', rango: ocupados[0] });
  assert.equal(avisoLimite('2026-10-18', ocupados), 'Con inicio el 18 puedes rentar hasta el 19: del 20 al 22 ya está rentado.');
  assert.equal(limiteFin('2026-10-23', ocupados).hasta, '2026-10-27');
  assert.equal(limiteFin('2026-10-30', ocupados), null);
  assert.equal(avisoLimite('', ocupados), '');
});

test('el día anterior cruza bien el cambio de mes', async () => {
  const { diaAnterior } = await import('../compartido/ocupadas.js');
  assert.equal(diaAnterior('2026-12-01'), '2026-11-30');
});

test('si el apartado cruza de mes, el aviso dice el mes', async () => {
  const { avisoLimite } = await import('../compartido/ocupadas.js');
  assert.equal(
    avisoLimite('2026-11-24', [{ inicio: '2026-11-27', fin: '2026-12-01' }]),
    'Con inicio el 24 de noviembre puedes rentar hasta el 26 de noviembre: del 27 de noviembre al 1 de diciembre ya está rentado.',
  );
});
