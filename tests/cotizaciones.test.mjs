import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { app } from '../backend/src/app.js';
import { query, pool } from '../backend/src/db.js';

// Pruebas de la API comercial: HU-01a, HU-04, HU-14a y HU-15a.
// Las que guardan datos usan la base de backend/.env y borran lo que crean.
let servidor;
let origen;
let hayBase = true;

test.before(async () => {
  servidor = app.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  origen = `http://127.0.0.1:${servidor.address().port}`;
  try { await query('SELECT 1'); } catch { hayBase = false; }
});

test.after(async () => {
  await new Promise((listo) => servidor.close(listo));
  await pool.end();
});

const pedir = async (metodo, ruta, cuerpo) => {
  const respuesta = await fetch(origen + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: cuerpo && JSON.stringify(cuerpo),
  });
  return { status: respuesta.status, datos: await respuesta.json() };
};

const solicitud = {
  cliente: {
    nombre: 'Prueba Automática', telefono: '6441234567', correo: 'prueba@correo.com',
    empresa: '', municipio: 'Cajeme', direccion: 'Calle de prueba 1, Centro',
  },
  notas: 'Creada por npm test',
  lineas: [{ equipoId: 1, cantidad: 1, fechaInicio: '2026-12-01', fechaFin: '2026-12-03' }],
};

// HU-14a · sin base: la solicitud se valida antes de guardar
test('HU-14a · rechaza una solicitud sin equipos', async () => {
  const { status } = await pedir('POST', '/api/cotizaciones/web', { ...solicitud, lineas: [] });
  assert.equal(status, 400);
});

test('HU-14a · rechaza datos del cliente inválidos y dice qué campo corregir', async () => {
  const { status, datos } = await pedir('POST', '/api/cotizaciones/web', {
    ...solicitud, cliente: { ...solicitud.cliente, telefono: '0123' },
  });
  assert.equal(status, 400);
  assert.ok(datos.errores.telefono);
});

test('HU-14a · rechaza cantidades fuera de 1 a 20, fechas al revés y notas de más de 500', async () => {
  const linea = solicitud.lineas[0];
  const casos = [
    { ...solicitud, lineas: [{ ...linea, cantidad: 21 }] },
    { ...solicitud, lineas: [{ ...linea, fechaInicio: '2026-12-05', fechaFin: '2026-12-01' }] },
    { ...solicitud, notas: 'a'.repeat(501) },
  ];
  for (const caso of casos) {
    assert.equal((await pedir('POST', '/api/cotizaciones/web', caso)).status, 400);
  }
});

test('HU-04 y HU-15a · un id inválido responde 404', async () => {
  assert.equal((await pedir('GET', '/api/equipos/abc')).status, 404);
  assert.equal((await pedir('PATCH', '/api/cotizaciones/abc/aprobar')).status, 404);
});

// Con base de datos
test('HU-01a · el catálogo trae nombre, tipo, modelo, tarifa por día y foto', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const { status, datos } = await pedir('GET', '/api/equipos');
  assert.equal(status, 200);
  assert.ok(datos.length > 0);
  for (const campo of ['id', 'nombre', 'tipo', 'modelo', 'tarifaDia', 'foto']) assert.ok(campo in datos[0]);
});

test('HU-04 · la ficha trae características y un equipo que no existe da 404', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const { status, datos } = await pedir('GET', '/api/equipos/1');
  assert.equal(status, 200);
  assert.ok('caracteristicas' in datos);
  assert.equal((await pedir('GET', '/api/equipos/999999')).status, 404);
});

test('HU-14a y HU-15a · se guarda Pendiente con folio y solo una Pendiente se aprueba', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const creada = await pedir('POST', '/api/cotizaciones/web', solicitud);
  assert.equal(creada.status, 201);
  const { id, folio } = creada.datos;
  t.after(async () => {
    const { rows } = await query('DELETE FROM cotizaciones WHERE id = $1 RETURNING cliente_id', [id]);
    if (rows.length) await query('DELETE FROM clientes WHERE id = $1', [rows[0].cliente_id]);
  });
  assert.match(folio, /^COT-\d{4,}$/);

  const { rows } = await query('SELECT origen, estado FROM cotizaciones WHERE id = $1', [id]);
  assert.deepEqual(rows[0], { origen: 'Web', estado: 'Pendiente' });

  const aprobada = await pedir('PATCH', `/api/cotizaciones/${id}/aprobar`);
  assert.equal(aprobada.status, 200);
  assert.equal(aprobada.datos.estado, 'Aprobada');
  assert.equal((await pedir('PATCH', `/api/cotizaciones/${id}/aprobar`)).status, 409);
  assert.equal((await pedir('PATCH', '/api/cotizaciones/999999/aprobar')).status, 404);
});
