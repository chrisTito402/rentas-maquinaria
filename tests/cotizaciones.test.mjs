import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { app } from '../backend/src/app.js';
import { query, pool } from '../backend/src/db.js';
import { listarEquipos } from '../backend/src/catalogo.js';
import { rangosOcupados } from '../backend/src/rutas/ocupadas.rutas.js';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { cifrarUsuario, indiceUsuario, hashContrasena } from '../backend/src/auth/credenciales.js';
import { hashToken, nombreCookie } from '../backend/src/auth/sesion.js';

// Pruebas de la API comercial: HU-01a, HU-04, HU-14a y HU-15a.
// Las que guardan datos usan la base de backend/.env y borran lo que crean.
let servidor;
let origen;
let hayBase = true;
let cookie = '';
let cuentaId;

test.before(async () => {
  servidor = app.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  origen = `http://127.0.0.1:${servidor.address().port}`;
  try { await query('SELECT 1'); } catch { hayBase = false; }
  if (hayBase) {
    process.env.AUTH_KEY ||= randomBytes(32).toString('hex');
    await query(await readFile(new URL('../backend/db/auth.sql', import.meta.url), 'utf8'));
    const usuario = 'prueba-' + randomBytes(8).toString('hex');
    const { rows } = await query('INSERT INTO auth_usuarios (usuario_cifrado, usuario_indice, contrasena_hash) VALUES ($1, $2, $3) RETURNING id',
      [cifrarUsuario(usuario), indiceUsuario(usuario), await hashContrasena(randomBytes(32).toString('hex'))]);
    cuentaId = rows[0].id;
    const token = randomBytes(32).toString('hex');
    await query("INSERT INTO auth_sesiones (token_hash, usuario_id, vence_en) VALUES ($1, $2, NOW() + INTERVAL '1 hour')", [hashToken(token), cuentaId]);
    cookie = `${nombreCookie()}=${token}`;
  }
});

test.after(async () => {
  if (cuentaId) await query('DELETE FROM auth_usuarios WHERE id = $1', [cuentaId]);
  await new Promise((listo) => servidor.close(listo));
  await pool.end();
});

const pedir = async (metodo, ruta, cuerpo) => {
  const respuesta = await fetch(origen + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: cuerpo && JSON.stringify(cuerpo),
  });
  return { status: respuesta.status, datos: await respuesta.json() };
};

const solicitud = {
  cliente: {
    nombre: 'Prueba Automática', telefono: '6441234567', correo: 'prueba@correo.com',
    empresa: '', municipio: 'Cajeme', direccion: 'Calle de prueba 1', codigoPostal: '85000', colonia: 'Ciudad Obregón Centro',
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
  assert.equal((await pedir('PATCH', '/api/cotizaciones/abc/aprobar')).status, hayBase ? 404 : 401);
});

// Con base de datos
test('HU-01b · el catálogo consulta la foto y disponibilidad guardadas en la BD', async () => {
  const guardado = { id: 1, foto: 'https://ejemplo.org/equipo.jpg', disponible: false };
  const equipos = await listarEquipos({
    async query(sql) {
      assert.match(sql, /foto, disponible FROM equipos/);
      return { rows: [guardado] };
    },
  });
  assert.deepEqual(equipos, [guardado]);
});

test('HU-01a y HU-01b · el catálogo trae foto y disponibilidad desde la BD', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const { status, datos } = await pedir('GET', '/api/equipos');
  assert.equal(status, 200);
  assert.ok(datos.length > 0);
  for (const campo of ['id', 'nombre', 'tipo', 'modelo', 'tarifaDia', 'foto', 'disponible']) assert.ok(campo in datos[0]);
  const { rows: [guardado] } = await query('SELECT foto, disponible FROM equipos WHERE id = $1', [datos[0].id]);
  assert.equal(datos[0].foto, guardado.foto);
  assert.equal(datos[0].disponible, guardado.disponible);
});

test('HU-04 · la ficha trae características y un equipo que no existe da 404', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const { status, datos } = await pedir('GET', '/api/equipos/1');
  assert.equal(status, 200);
  assert.ok('caracteristicas' in datos);
  assert.equal(typeof datos.disponible, 'boolean');
  const { rows: [guardado] } = await query('SELECT foto, disponible FROM equipos WHERE id = 1');
  assert.equal(datos.foto, guardado.foto);
  assert.equal(datos.disponible, guardado.disponible);
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

// HU-13b · Costo de envío por zona
const borrarCotizacion = async (id) => {
  const { rows } = await query('DELETE FROM cotizaciones WHERE id = $1 RETURNING cliente_id', [id]);
  if (rows.length) await query('DELETE FROM clientes WHERE id = $1', [rows[0].cliente_id]);
};

test('HU-13b · fuera de zona no se guarda y se marca el municipio', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const { status, datos } = await pedir('POST', '/api/cotizaciones/web', {
    ...solicitud, cliente: { ...solicitud.cliente, municipio: 'Hermosillo', codigoPostal: '83000', colonia: 'Hermosillo Centro' },
  });
  assert.equal(status, 400);
  assert.match(datos.errores.municipio, /Hermosillo/);
});

test('HU-13b · el servidor guarda el envío por unidad y el IVA sobre renta + envío', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const creada = await pedir('POST', '/api/cotizaciones/web', {
    ...solicitud,
    cliente: { ...solicitud.cliente, municipio: 'Navojoa', codigoPostal: '85800', colonia: 'Navojoa Centro' },
    lineas: [{ ...solicitud.lineas[0], cantidad: 2 }],
  });
  assert.equal(creada.status, 201);
  t.after(() => borrarCotizacion(creada.datos.id));
  const { datos } = await pedir('GET', `/api/cotizaciones/${creada.datos.id}`);
  assert.equal(datos.envio, 2400);                                  // 2 unidades × $1,200 (zona 2)
  assert.equal(datos.iva, Math.round((datos.subtotal + datos.envio) * 16) / 100);
  assert.equal(datos.total, datos.subtotal + datos.envio + datos.iva);
});

// HU-02a · Fechas ocupadas
const lineaEn = (fechaInicio, fechaFin) => ({ equipoId: 3, cantidad: 1, fechaInicio, fechaFin });

test('HU-02a · al aprobar se apartan las fechas y un rango que choca no se puede pedir', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const primera = await pedir('POST', '/api/cotizaciones/web', { ...solicitud, lineas: [lineaEn('2027-03-10', '2027-03-12')] });
  assert.equal(primera.status, 201);
  t.after(() => borrarCotizacion(primera.datos.id));

  // Pendiente todavía no aparta
  assert.deepEqual((await pedir('GET', '/api/equipos/3/ocupadas')).datos.filter((o) => o.inicio.startsWith('2027-03')), []);

  assert.equal((await pedir('PATCH', `/api/cotizaciones/${primera.datos.id}/aprobar`)).status, 200);
  const ocupadas = (await pedir('GET', '/api/equipos/3/ocupadas')).datos;
  assert.ok(ocupadas.some((o) => o.inicio === '2027-03-10' && o.fin === '2027-03-12'));

  const choca = await pedir('POST', '/api/cotizaciones/web', { ...solicitud, lineas: [lineaEn('2027-03-12', '2027-03-14')] });
  assert.equal(choca.status, 409);
  assert.equal(choca.datos.error, 'Este equipo ya está rentado del 10/03/2027 al 12/03/2027.');

  const libre = await pedir('POST', '/api/cotizaciones/web', { ...solicitud, lineas: [lineaEn('2027-03-13', '2027-03-15')] });
  assert.equal(libre.status, 201);
  t.after(() => borrarCotizacion(libre.datos.id));
});

test('HU-02a · no se aprueba una cotización cuyas fechas ya están apartadas', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const a = await pedir('POST', '/api/cotizaciones/web', { ...solicitud, lineas: [lineaEn('2027-04-01', '2027-04-03')] });
  const b = await pedir('POST', '/api/cotizaciones/web', { ...solicitud, lineas: [lineaEn('2027-04-03', '2027-04-05')] });
  t.after(async () => { await borrarCotizacion(a.datos.id); await borrarCotizacion(b.datos.id); });
  assert.equal((await pedir('PATCH', `/api/cotizaciones/${a.datos.id}/aprobar`)).status, 200);
  const segunda = await pedir('PATCH', `/api/cotizaciones/${b.datos.id}/aprobar`);
  assert.equal(segunda.status, 409);
  assert.match(segunda.datos.error, /ya está rentado del 01\/04\/2027 al 03\/04\/2027/);
  const { rows } = await query('SELECT estado FROM cotizaciones WHERE id = $1', [b.datos.id]);
  assert.equal(rows[0].estado, 'Pendiente');
});

test('HU-02a · un equipo con id inválido responde 404 en ocupadas', async () => {
  assert.equal((await pedir('GET', '/api/equipos/abc/ocupadas')).status, 404);
});

// HU-16 · Filtros por estado y origen
test('HU-16 · un estado u origen que no existe responde 400', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  assert.equal((await pedir('GET', '/api/cotizaciones?estado=Borrada')).status, 400);
  assert.equal((await pedir('GET', '/api/cotizaciones?origen=Fax')).status, 400);
});

test('HU-16 · filtrar por estado y origen solo trae las que coinciden', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const creada = await pedir('POST', '/api/cotizaciones/web', solicitud);
  assert.equal(creada.status, 201);
  t.after(() => borrarCotizacion(creada.datos.id));
  const { status, datos } = await pedir('GET', '/api/cotizaciones?estado=Pendiente&origen=Web');
  assert.equal(status, 200);
  assert.ok(datos.some((c) => c.id === creada.datos.id));
  assert.ok(datos.every((c) => c.estado === 'Pendiente' && c.origen === 'Web'));
  const aprobadas = await pedir('GET', '/api/cotizaciones?estado=Aprobada');
  assert.ok(aprobadas.datos.every((c) => c.estado === 'Aprobada'));
  assert.ok(!aprobadas.datos.some((c) => c.id === creada.datos.id));
});

// HU-05 · Crear cotización desde el panel
test('HU-05 · sin sesión no se puede crear una cotización desde el panel', async () => {
  const respuesta = await fetch(origen + '/api/cotizaciones/panel', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(solicitud),
  });
  assert.equal(respuesta.status, 401);
});

test('HU-05 · la misma cotización por /web y por /panel da el mismo total; la del panel queda Panel y Pendiente', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const web = await pedir('POST', '/api/cotizaciones/web', solicitud);
  const panel = await pedir('POST', '/api/cotizaciones/panel', solicitud);
  assert.equal(web.status, 201);
  assert.equal(panel.status, 201);
  t.after(async () => { await borrarCotizacion(web.datos.id); await borrarCotizacion(panel.datos.id); });
  assert.equal(panel.datos.total, web.datos.total);
  assert.match(panel.datos.folio, /^COT-\d{4,}$/);
  const { rows } = await query('SELECT origen, estado FROM cotizaciones WHERE id = $1', [panel.datos.id]);
  assert.deepEqual(rows[0], { origen: 'Panel', estado: 'Pendiente' });
});

test('HU-07 · sin sesión no se puede descargar ninguna cotización', async () => {
  const respuesta = await fetch(origen + '/api/cotizaciones/1/pdf');
  assert.equal(respuesta.status, 401);
});

test('HU-07 · solo una Aprobada devuelve un PDF descargable', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const creada = await pedir('POST', '/api/cotizaciones/web', solicitud);
  assert.equal(creada.status, 201);
  t.after(() => borrarCotizacion(creada.datos.id));
  const ruta = `/api/cotizaciones/${creada.datos.id}/pdf`;
  const descargar = (url) => fetch(origen + url, { headers: { Cookie: cookie } });

  assert.equal((await descargar('/api/cotizaciones/no/pdf')).status, 400);
  assert.equal((await descargar('/api/cotizaciones/999999/pdf')).status, 404);
  const pendiente = await descargar(ruta);
  assert.equal(pendiente.status, 409);
  assert.match((await pendiente.json()).error, /Aprobadas/);

  assert.equal((await pedir('PATCH', `/api/cotizaciones/${creada.datos.id}/aprobar`)).status, 200);
  const respuesta = await descargar(ruta);
  assert.equal(respuesta.status, 200);
  assert.match(respuesta.headers.get('content-type'), /application\/pdf/);
  assert.match(respuesta.headers.get('content-disposition'), new RegExp(`${creada.datos.folio}\\.pdf`));
  const pdf = Buffer.from(await respuesta.arrayBuffer());
  assert.ok(pdf.subarray(0, 8).toString().startsWith('%PDF-'));
});

// Roles · solo el administrador aprueba (notas de la re-presentación del Sprint 1)
test('Roles · el auxiliar no puede aprobar (403) y la cotización sigue Pendiente', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const usuario = 'auxiliar-' + randomBytes(8).toString('hex');
  const { rows: [cuenta] } = await query(
    "INSERT INTO auth_usuarios (usuario_cifrado, usuario_indice, contrasena_hash, rol) VALUES ($1, $2, $3, 'auxiliar') RETURNING id",
    [cifrarUsuario(usuario), indiceUsuario(usuario), await hashContrasena(randomBytes(32).toString('hex'))]);
  const token = randomBytes(32).toString('hex');
  await query("INSERT INTO auth_sesiones (token_hash, usuario_id, vence_en) VALUES ($1, $2, NOW() + INTERVAL '1 hour')", [hashToken(token), cuenta.id]);
  const creada = await pedir('POST', '/api/cotizaciones/web', solicitud);
  t.after(async () => { await borrarCotizacion(creada.datos.id); await query('DELETE FROM auth_usuarios WHERE id = $1', [cuenta.id]); });

  const comoAuxiliar = (metodo, ruta) => fetch(origen + ruta, { method: metodo, headers: { Cookie: `${nombreCookie()}=${token}` } });
  const sesion = await (await comoAuxiliar('GET', '/api/auth/sesion')).json();
  assert.equal(sesion.usuario.rol, 'auxiliar');
  assert.equal((await comoAuxiliar('GET', '/api/cotizaciones')).status, 200);          // sí puede consultar
  assert.equal((await comoAuxiliar('PATCH', `/api/cotizaciones/${creada.datos.id}/aprobar`)).status, 403);
  const { rows } = await query('SELECT estado FROM cotizaciones WHERE id = $1', [creada.datos.id]);
  assert.equal(rows[0].estado, 'Pendiente');
});

// A4 · Código postal (con el catálogo cargado con npm run cp:cargar)
const hayCatalogoCp = async () => (await pedir('GET', '/api/codigos-postales/85000')).status === 200;

test('A4 · el código postal debe tener 5 dígitos y uno que no existe da 404', async (t) => {
  assert.equal((await pedir('GET', '/api/codigos-postales/12')).status, 400);
  if (!hayBase || !(await hayCatalogoCp())) return t.skip('sin el catálogo de códigos postales');
  assert.equal((await pedir('GET', '/api/codigos-postales/99999')).status, 404);
});

test('A4 · el C.P. 85000 es de Cajeme, Sonora, y trae sus colonias', async (t) => {
  if (!hayBase || !(await hayCatalogoCp())) return t.skip('sin el catálogo de códigos postales');
  const { datos } = await pedir('GET', '/api/codigos-postales/85000');
  assert.equal(datos.municipio, 'Cajeme');
  assert.equal(datos.estado, 'Sonora');
  assert.ok(datos.colonias.includes('Ciudad Obregón Centro'));
});

test('A4 · sin código postal no se guarda la solicitud', async () => {
  const { status, datos } = await pedir('POST', '/api/cotizaciones/web', { ...solicitud, cliente: { ...solicitud.cliente, codigoPostal: '' } });
  assert.equal(status, 400);
  assert.ok(datos.errores.codigoPostal);
});

test('A4 · el C.P. tiene que ser del municipio y la colonia de ese C.P.', async (t) => {
  if (!hayBase || !(await hayCatalogoCp())) return t.skip('sin el catálogo de códigos postales');
  const otroMunicipio = await pedir('POST', '/api/cotizaciones/web', { ...solicitud, cliente: { ...solicitud.cliente, codigoPostal: '85800' } });
  assert.equal(otroMunicipio.status, 400);
  assert.match(otroMunicipio.datos.errores.municipio, /Navojoa/);
  const otraColonia = await pedir('POST', '/api/cotizaciones/web', { ...solicitud, cliente: { ...solicitud.cliente, colonia: 'Colonia Inventada' } });
  assert.equal(otraColonia.status, 400);
  assert.ok(otraColonia.datos.errores.colonia);
});

test('A4 · se guardan el código postal y la colonia del cliente', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const creada = await pedir('POST', '/api/cotizaciones/web', solicitud);
  assert.equal(creada.status, 201);
  t.after(() => borrarCotizacion(creada.datos.id));
  const { datos } = await pedir('GET', `/api/cotizaciones/${creada.datos.id}`);
  assert.equal(datos.cliente.codigoPostal, '85000');
  assert.equal(datos.cliente.colonia, 'Ciudad Obregón Centro');
});

// A1 · Vigencia de 15 días naturales (re-presentación del Sprint 1)
const crearConEdad = async (t, dias, aprobar = false) => {
  const creada = await pedir('POST', '/api/cotizaciones/web', solicitud);
  assert.equal(creada.status, 201);
  t.after(() => borrarCotizacion(creada.datos.id));
  if (aprobar) assert.equal((await pedir('PATCH', `/api/cotizaciones/${creada.datos.id}/aprobar`)).status, 200);
  await query(`UPDATE cotizaciones SET creada_en = NOW() - make_interval(days => $2::int) WHERE id = $1`, [creada.datos.id, dias]);
  return creada.datos;
};
const estadoDe = async (id) => (await pedir('GET', `/api/cotizaciones/${id}`)).datos.estado;

test('A1 · una Pendiente de hace 14 días sigue Pendiente', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const cotizacion = await crearConEdad(t, 14);
  assert.equal(await estadoDe(cotizacion.id), 'Pendiente');
});

test('A1 · una Pendiente de hace 15 días queda Vencida y ya no se puede aprobar', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const cotizacion = await crearConEdad(t, 15);
  assert.equal(await estadoDe(cotizacion.id), 'Vencida');
  const aprobar = await pedir('PATCH', `/api/cotizaciones/${cotizacion.id}/aprobar`);
  assert.equal(aprobar.status, 409);
  assert.match(aprobar.datos.error, /venció/);
  const { datos } = await pedir('GET', '/api/cotizaciones?estado=Vencida');
  assert.ok(datos.some((c) => c.id === cotizacion.id));
});

test('A1 · una Aprobada sin unidades asignadas vence y libera sus fechas', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const cotizacion = await crearConEdad(t, 16, true);
  assert.equal(await estadoDe(cotizacion.id), 'Vencida');
  const ocupadas = await rangosOcupados({ query }, solicitud.lineas[0].equipoId);
  assert.ok(!ocupadas.some((rango) => rango.folio === cotizacion.folio));
});

test('A1 · una Aprobada con unidades ya asignadas por Operación no vence', async (t) => {
  if (!hayBase) return t.skip('sin PostgreSQL');
  const cotizacion = await crearConEdad(t, 20, true);
  const unidad = 'PRUEBA-A1-' + randomBytes(4).toString('hex');
  await query('INSERT INTO operacion_equipos (id, datos) VALUES ($1, $2)', [unidad, { id: unidad, state: 'apartado' }]);
  await query('INSERT INTO operacion_rentas (id, equipo_id, datos) VALUES ($1, $1, $2)',
    [unidad, { id: unidad, unit: unidad, cotizacionId: cotizacion.id, status: 'apartado' }]);
  t.after(async () => {
    await query('DELETE FROM operacion_rentas WHERE id = $1', [unidad]);
    await query('DELETE FROM operacion_equipos WHERE id = $1', [unidad]);
  });
  assert.equal(await estadoDe(cotizacion.id), 'Aprobada');
});
