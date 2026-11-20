import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import express from '../backend/node_modules/express/index.js';
import { crearRutasAuth } from '../backend/src/auth/rutas.js';
import { cifrarUsuario, descifrarUsuario, indiceUsuario, hashContrasena, verificarContrasena } from '../backend/src/auth/credenciales.js';
import { hashToken, protegerSesion } from '../backend/src/auth/sesion.js';
import { app } from '../backend/src/app.js';

process.env.AUTH_KEY = randomBytes(32).toString('hex');

test('usuario cifrado autenticado, índice normalizado y contraseña con hash individual', async () => {
  const uno = cifrarUsuario('Operativa');
  assert.notEqual(uno, cifrarUsuario('Operativa'));
  assert.equal(descifrarUsuario(uno), 'operativa');
  assert.equal(indiceUsuario(' Operativa '), indiceUsuario('operativa'));
  assert.ok(!uno.includes('operativa'));
  const partes = uno.split('.');
  partes[2] = Buffer.from('manipulado').toString('base64url');
  assert.throws(() => descifrarUsuario(partes.join('.')));
  const hash = await hashContrasena('una-clave-larga-de-prueba');
  assert.match(hash, /^\$argon2id\$/);
  assert.notEqual(hash, await hashContrasena('una-clave-larga-de-prueba'));
  assert.ok(await verificarContrasena(hash, 'una-clave-larga-de-prueba'));
  assert.ok(!await verificarContrasena(hash, 'incorrecta'));
});

test('login, renovación, sesión vencida, usuario inactivo, logout y protección de origen', async t => {
  const cuenta = { id: 1, usuario_cifrado: cifrarUsuario('operativa'), contrasena_hash: await hashContrasena('una-clave-larga-de-prueba'), activo: true };
  const sesiones = new Map();
  async function consultar(sql, valores = []) {
    if (sql.startsWith('SELECT id,')) return { rows: valores[0] === indiceUsuario('operativa') ? [cuenta] : [] };
    if (sql.startsWith('INSERT INTO auth_sesiones')) sesiones.set(valores[0], valores[2]);
    if (sql.startsWith('DELETE FROM auth_sesiones WHERE token_hash')) sesiones.delete(valores[0]);
    if (sql.startsWith('SELECT u.id')) return { rows: sesiones.get(valores[0]) > new Date() && cuenta.activo ? [cuenta] : [] };
    return { rows: [] };
  }
  const api = express();
  api.use(express.json());
  api.use('/auth', crearRutasAuth(consultar));
  api.get('/privado', protegerSesion(consultar), (req, res) => res.json({ ok: true }));
  api.use((error, req, res, next) => res.status(error.status || 500).json({ error: error.message }));
  const servidor = api.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  t.after(() => new Promise(resolve => servidor.close(resolve)));
  const origen = `http://127.0.0.1:${servidor.address().port}`;
  const pedir = (ruta, { body, cookie = '', origin } = {}) => fetch(origen + ruta, {
    method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', Cookie: cookie, ...(origin && { Origin: origin }) }, body: body && JSON.stringify(body),
  });
  assert.equal((await pedir('/privado')).status, 401);
  assert.equal((await pedir('/auth/login', { body: {} })).status, 400);
  const fallida = await pedir('/auth/login', { body: { usuario: 'operativa', contrasena: 'mal' } });
  const inexistente = await pedir('/auth/login', { body: { usuario: 'no-existe', contrasena: 'mal' } });
  assert.equal(fallida.status, 401);
  assert.deepEqual(await fallida.json(), await inexistente.json());
  const body = { usuario: ' OPERATIVA ', contrasena: 'una-clave-larga-de-prueba' };
  assert.equal((await pedir('/auth/login', { body, origin: 'https://otro.example' })).status, 403);
  const login = await pedir('/auth/login', { body });
  assert.equal(login.status, 200);
  assert.deepEqual(await login.json(), { usuario: { id: 1, nombre: 'operativa' } });
  assert.match(login.headers.get('set-cookie'), /HttpOnly/);
  assert.match(login.headers.get('set-cookie'), /SameSite=Lax/i);
  let cookie = login.headers.get('set-cookie').split(';')[0];
  assert.ok(sesiones.has(hashToken(cookie.split('=')[1])));
  assert.equal((await pedir('/privado', { cookie })).status, 200);
  const siguiente = await pedir('/auth/login', { body, cookie });
  assert.equal((await pedir('/privado', { cookie })).status, 401);
  cookie = siguiente.headers.get('set-cookie').split(';')[0];
  assert.equal((await pedir('/auth/sesion', { cookie })).status, 200);
  cuenta.activo = false;
  assert.equal((await pedir('/privado', { cookie })).status, 401);
  cuenta.activo = true;
  sesiones.set(hashToken(cookie.split('=')[1]), new Date(0));
  assert.equal((await pedir('/auth/sesion', { cookie })).status, 401);
  const nueva = await pedir('/auth/login', { body });
  cookie = nueva.headers.get('set-cookie').split(';')[0];
  assert.equal((await pedir('/auth/logout', { cookie, body: {} })).status, 200);
  assert.equal((await pedir('/privado', { cookie })).status, 401);
  assert.equal((await pedir('/auth/logout', { body: {} })).status, 200);
  let limitada;
  for (let intento = 0; intento < 11; intento++) limitada = await pedir('/auth/login', { body: {} });
  assert.equal(limitada.status, 429);
});

test('la API real rechaza operaciones y cotizaciones privadas antes de acceder a PostgreSQL', async t => {
  const servidor = app.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  t.after(() => new Promise(resolve => servidor.close(resolve)));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  for (const [metodo, ruta] of [['GET', '/api/operacion'], ['POST', '/api/operacion/acciones'], ['GET', '/api/cotizaciones'], ['GET', '/api/cotizaciones/1'], ['PATCH', '/api/cotizaciones/1/aprobar']]) {
    assert.equal((await fetch(base + ruta, { method: metodo })).status, 401, ruta);
  }
  assert.equal((await fetch(base + '/api/cotizaciones/web', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 400);
});
