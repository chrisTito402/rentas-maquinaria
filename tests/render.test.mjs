import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { app } from '../backend/src/app.js';
import { prepararBase } from '../backend/src/preparar-base.js';

// Este cliente simulado comprueba el arranque; falta probar la conexión real en Render.
function baseSimulada({ nueva = false, falla = false } = {}) {
  const consultas = [];
  let liberada = false;
  const cliente = {
    async query(sql) {
      consultas.push(sql);
      if (sql.includes('to_regclass')) return { rows: [{
        equipos: nueva ? null : 'equipos', clientes: nueva ? null : 'clientes',
        cotizaciones: nueva ? null : 'cotizaciones', detalle: nueva ? null : 'cotizacion_equipos',
      }] };
      if (falla && sql.includes('CREATE TABLE')) throw new Error('No se pudo preparar');
      return { rows: [] };
    },
    release() { liberada = true; },
  };
  return { connect: async () => cliente, consultas, get liberada() { return liberada; } };
}

test('Una base nueva recibe tablas y ejemplos dentro de una transacción', async () => {
  process.env.DATABASE_URL ??= 'postgres://prueba/local';
  const base = baseSimulada({ nueva: true });
  await prepararBase(base);
  assert.equal(base.consultas[0], 'BEGIN');
  assert.ok(base.consultas.some(sql => sql.includes('INSERT INTO equipos')));
  assert.equal(base.consultas.at(-1), 'COMMIT');
  assert.ok(base.liberada);
});

test('Al reiniciar no vuelve a insertar ejemplos ni borra rentas o fotos', async () => {
  const base = baseSimulada();
  await prepararBase(base);
  assert.ok(base.consultas.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS operacion_rentas')));
  assert.ok(base.consultas.every(sql => !/^\s*(DROP|DELETE|TRUNCATE|INSERT)\b/im.test(sql)));
  assert.equal(base.consultas.at(-1), 'COMMIT');
});

test('Si falla la preparación, revierte los cambios y libera la conexión', async () => {
  const base = baseSimulada({ falla: true });
  await assert.rejects(prepararBase(base), /No se pudo preparar/);
  assert.equal(base.consultas.at(-1), 'ROLLBACK');
  assert.ok(!base.consultas.includes('COMMIT'));
  assert.ok(base.liberada);
});

test('La página abre en el inicio y al recargar una pantalla interna', async t => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origen = `http://127.0.0.1:${server.address().port}`;
  const portada = await fetch(origen, { headers: { Accept: 'text/html' } });
  assert.equal(portada.status, 200);
  const html = await portada.text();
  assert.match(html, /id="root"/);
  for (const ruta of ['/gestion/operacion', '/gestion/rentas/R-001']) {
    const respuesta = await fetch(origen + ruta, { headers: { Accept: 'text/html' } });
    assert.equal(respuesta.status, 200);
    assert.equal(await respuesta.text(), html);
  }
  const asset = html.match(/src="([^"]+\.js)"/)[1];
  const archivo = await fetch(origen + asset);
  assert.equal(archivo.status, 200);
  assert.match(archivo.headers.get('content-type'), /javascript/);
  const api = await fetch(origen + '/api/no-existe', { headers: { Accept: 'text/html' } });
  assert.equal(api.status, 404);
  assert.deepEqual(await api.json(), { error: 'Ruta no encontrada' });
});
