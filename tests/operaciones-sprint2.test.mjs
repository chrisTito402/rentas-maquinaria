import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { fork } from 'node:child_process';
import pg from '../backend/node_modules/pg/lib/index.js';
import sharp from '../backend/node_modules/sharp/lib/index.js';

// Usar una base de pruebas explícita. Cada ejecución crea su propio esquema vacío.
test('recorrido del sprint 2 con cuentas reales y PostgreSQL', { skip: !process.env.TEST_DATABASE_URL }, async t => {
  const esquema = 'prueba_op_' + randomBytes(8).toString('hex');
  const adminDB = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  await adminDB.connect();
  await adminDB.query('CREATE SCHEMA ' + esquema);
  t.after(async () => { await adminDB.query('DROP SCHEMA ' + esquema + ' CASCADE'); await adminDB.end(); });
  const url = new URL(process.env.TEST_DATABASE_URL);
  url.searchParams.set('options', '-c search_path=' + esquema);
  process.env.DATABASE_URL = url.toString();
  process.env.AUTH_KEY = randomBytes(32).toString('hex');
  const { pool } = await import('../backend/src/db.js');
  const { prepararBase } = await import('../backend/src/preparar-base.js');
  const { cifrarUsuario, indiceUsuario, hashContrasena } = await import('../backend/src/auth/credenciales.js');
  await prepararBase();
  const clave = randomBytes(20).toString('hex');
  await pool.query("INSERT INTO auth_usuarios(usuario_cifrado,usuario_indice,contrasena_hash,rol) VALUES ($1,$2,$3,'admin')",
    [cifrarUsuario('encargado'), indiceUsuario('encargado'), await hashContrasena(clave)]);
  let server, base;
  async function arrancar() {
    server = fork(new URL('./soporte/servidor-operaciones.mjs', import.meta.url), [], { execArgv: [] });
    const [puerto] = await once(server, 'message', { signal: AbortSignal.timeout(15000) });
    base = 'http://127.0.0.1:' + puerto + '/api';
  }
  async function detener() {
    if (!server.connected) return;
    const salida = once(server, 'exit');
    server.disconnect();
    await salida;
  }
  await arrancar();
  t.after(async () => { await detener(); await pool.end(); });
  async function pedir(method, path, cookie, body, esperado = 200) {
    const response = await fetch(base + path, { method, headers: { Cookie: cookie || '', 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
    const data = await response.json();
    if (esperado !== null) assert.equal(response.status, esperado, method + ' ' + path + ' ' + (data.error || ''));
    return { data, status: response.status, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  const login = async (usuario, esperado = 200) => (await pedir('POST', '/auth/login', '', { usuario, contrasena: clave }, esperado)).cookie;
  const admin = await login('encargado');
  const personal = {};
  for (const rol of ['operador','consulta','auxiliar']) {
    const { data } = await pedir('POST','/cuentas',admin,{ nombre: rol, rol, contrasena: clave },201);
    personal[rol] = { id: data.id, cookie: await login(rol) };
  }
  const operador = personal.operador.cookie;
  const cambiar = (rol, activo) => pedir('PATCH','/cuentas/' + personal.consulta.id,admin,{ rol, activo });
  await t.test('gestión de cuentas, permisos y retiro de sesiones', async () => {
    await pedir('POST','/cuentas',admin,{ nombre:'CONSULTA', rol:'admin', contrasena: clave },409);
    await pedir('PATCH','/cuentas/1',admin,{ rol:'consulta', activo:false },409);
    for (const {cookie} of Object.values(personal)) await pedir('GET','/cuentas',cookie,null,403);
    for (const {cookie} of [personal.consulta,personal.auxiliar]) {
      await pedir('GET','/operacion',cookie);
      await pedir('POST','/operacion/acciones',cookie,{},403);
      await pedir('POST','/operacion/reservaciones/1/asignar',cookie,{},403);
      await pedir('POST','/operacion/unidades/U/taller',cookie,{},403);
      await pedir('POST','/operacion/equipos/1/unidades',cookie,{},403);
    }
    await cambiar('operador',true);
    await pedir('GET','/auth/sesion',personal.consulta.cookie,null,401);
    const nueva = await login('consulta');
    assert.equal((await pedir('GET','/auth/sesion',nueva)).data.usuario.rol,'operador');
    await cambiar('consulta',false);
    await login('consulta',401);
    await cambiar('consulta',true);
    await pedir('GET','/operacion',nueva,null,401);
    const auxiliar = personal.auxiliar.cookie;
    await pedir('POST','/auth/logout',auxiliar,{});
    await pedir('GET','/operacion',auxiliar,null,401);
    await pedir('POST','/operacion/acciones',auxiliar,{},401);
    await pedir('POST','/cotizaciones/panel',operador,{},403);
  });
  const hoy = new Date().toLocaleDateString('sv-SE',{ timeZone: 'America/Hermosillo' });
  const proxima = d => { const fecha = new Date(hoy + 'T12:00:00Z'); fecha.setUTCDate(fecha.getUTCDate()+d); return fecha.toISOString().slice(0,10); };
  async function cotizar(dias) {
    const { data: cot } = await pedir('POST','/cotizaciones/web','',{
      cliente:{nombre:'Equipo Prueba',telefono:'6441234567',correo:'prueba@example.com',empresa:'',municipio:'Cajeme',direccion:'Calle de prueba 1'},
      notas:'Prueba',lineas:[{equipoId:1,cantidad:1,fechaInicio:proxima(dias),fechaFin:proxima(dias+1)}],
    },201);
    await pedir('PATCH','/cotizaciones/'+cot.id+'/aprobar',admin,{});
    return cot.id;
  }
  const asignar = (cot,id,esperado=200) => pedir('POST','/operacion/reservaciones/'+cot+'/asignar',operador,{unidades:[id]},esperado);
  const mover = (id,accion,campos,esperado=200) => pedir('POST','/operacion/acciones',operador,{id,accion,campos},esperado);
  const taller = (id,accion,campos,esperado=200) => pedir('POST','/operacion/unidades/'+id+'/taller',operador,{accion,campos:{date:hoy,...campos}},esperado);
  let renta,otra,pendiente,foto;
  await t.test('dos asignaciones simultáneas mantienen una sola renta activa por unidad', async () => {
    const a = await cotizar(1), b = await cotizar(4);
    const intentos = await Promise.all([asignar(a,'EQ-PRUEBA',null),asignar(b,'EQ-PRUEBA',null)]);
    assert.deepEqual(intentos.map(i=>i.status).sort(),[200,409]);
    const panel = (await pedir('GET','/operacion',operador)).data;
    assert.equal(panel.rentals.length,1);
    renta = panel.rentals[0].id;
    assert.equal(panel.rentals[0].events[0].by,'operador');
    pendiente = panel.reservaciones[0].id;
  });
  await t.test('falla, taller, reparación y revisión conservan la renta y el autor', async () => {
    await mover(renta,'prepare',{mechanic:'Ana',notes:'Revisión completa',result:'ready'});
    await mover(renta,'document',{hours:'12'});
    foto = 'data:image/png;base64,' + (await sharp({create:{width:12,height:10,channels:3,background:'white'}}).png().toBuffer()).toString('base64');
    await mover(renta,'photo',{image:foto});
    await mover(renta,'photo',{image:'data:image/png;base64,'+Buffer.from('archivo ilegible').toString('base64')},400);
    await mover(renta,'deliver',{date:hoy,receiver:'Cliente de prueba'});
    await mover(renta,'cancel',{notes:'Cambio',confirm:'si'},409);
    await mover(renta,'issue',{date:proxima(-1),notes:'Antes de entregar',mechanic:'Ana'},409);
    await mover(renta,'issue',{date:hoy,notes:'Ruido en rueda',mechanic:'Ana'});
    await mover(renta,'review',{date:hoy,notes:'Continúa en revisión',mechanic:'Ana',issueId:'1',result:'Pendiente'});
    await mover(renta,'issue',{date:hoy,notes:'Ajuste menor',mechanic:'Joel'});
    await mover(renta,'review',{date:hoy,notes:'Ajuste en sitio',mechanic:'Joel',issueId:'2',result:'Resuelta'});
    await mover(renta,'review',{date:hoy,notes:'Requiere reparación',mechanic:'Ana',issueId:'1',result:'Taller'});
    await taller('EQ-PRUEBA','ingresar',{notes:'Revisar rueda'});
    await taller('EQ-PRUEBA','liberar',{notes:'Lista',mechanic:'Ana'},409);
    await mover(renta,'issue',{date:hoy,notes:'Otra pieza por revisar',mechanic:'Joel'});
    await mover(renta,'review',{date:hoy,notes:'Requiere otro trabajo',mechanic:'Joel',issueId:'3',result:'Taller'});
    await taller('EQ-PRUEBA','trabajo',{notes:'Cambio de rueda',mechanic:'Ana',result:'Gira bien'});
    const {data} = await taller('EQ-PRUEBA','liberar',{notes:'Revisada',mechanic:'Ana'});
    assert.equal(data.units[0].state,'En renta');
    assert.equal(data.rentals[0].issues[0].estado,'Resuelta');
    assert.equal(data.rentals[0].events.at(-1).usuarioId,personal.operador.id);
    assert.deepEqual(data.rentals[0].issues.map(f => f.estado), ['Resuelta','Resuelta','Taller']);
    await taller('EQ-PRUEBA','ingresar',{notes:'Segunda reparación'});
    await taller('EQ-PRUEBA','trabajo',{notes:'Cambiar pieza',mechanic:'Joel',result:'Funciona'});
    await taller('EQ-PRUEBA','liberar',{notes:'Segunda falla atendida',mechanic:'Joel'});
    await mover(renta,'return',{date:hoy,receiver:'Ana'});
    await mover(renta,'close',{mechanic:'Ana',notes:'Equipo completo',result:'Disponible'});
  });
  await t.test('preventivo bloquea su día y cancelar libera la unidad y conserva el motivo', async () => {
    const panel = (await pedir('GET','/operacion',operador)).data;
    const inicio = panel.reservaciones.find(c=>c.id===pendiente).lineas[0].inicio;
    await taller('EQ-PRUEBA','programar',{date:inicio,notes:'Revisión programada'});
    await asignar(pendiente,'EQ-PRUEBA',409);
    const {data} = await asignar(pendiente,'EQ-OTRA');
    otra = data.rentals.find(r=>r.unit==='EQ-OTRA').id;
    await mover(otra,'cancel',{notes:'Cambio',confirm:'no'},409);
    await mover(otra,'cancel',{notes:'  ',confirm:'si'},409);
    const fin = (await mover(otra,'cancel',{notes:'El cliente pospuso el trabajo',confirm:'si'})).data;
    assert.equal(fin.units.find(u=>u.id==='EQ-OTRA').state,'Disponible');
    assert.equal(fin.rentals.find(r=>r.id===otra).cancelacion.by,'operador');
  });
  await t.test('persiste la foto, el historial y la cancelación al volver a abrir el servidor', async () => {
    const procesoAnterior = server.pid;
    await detener(); await arrancar();
    assert.notEqual(server.pid, procesoAnterior);
    const {data} = await pedir('GET','/operacion',operador);
    assert.equal(data.rentals.find(r=>r.id===renta).documentPhoto.image,foto);
    assert.equal(data.rentals.find(r=>r.id===otra).status,'Cancelada');
    assert.equal(data.units.find(u=>u.id==='EQ-PRUEBA').taller[0].trabajos[0].mecanico,'Ana');
    assert.equal(data.rentals.find(r=>r.id===renta).events.at(-1).by,'operador');
  });
  await t.test('un preventivo y dos cancelaciones respetan el historial de la misma unidad', async () => {
    const id = 'EQ-TALLER';
    await pedir('POST','/operacion/equipos/1/unidades',operador,{unidad:id});
    const unidad = panel => panel.data.units.find(u=>u.id===id);
    const preventiva = unidad(await taller(id,'programar',{notes:'Servicio de frenos'})).taller[0];
    await taller(id,'ingresar',{plan:preventiva.at, notes:'Entrada preventiva'});
    const cot = await cotizar(35);
    await asignar(cot,id,409);
    await taller(id,'trabajo',{notes:'Ajustar frenos',result:'Listos',mechanic:'Ana'});
    await taller(id,'liberar',{notes:'',mechanic:'Ana'},409);
    const libre = unidad(await taller(id,'liberar',{notes:'Probado',mechanic:'Ana'}));
    assert.equal(libre.state,'Disponible');
    assert.equal(libre.taller[0].estado,'Terminado');
    const reservar = async c => (await asignar(c,id)).data.rentals.find(r=>r.cotizacionId===c).id;
    const r1 = await reservar(cot);
    await mover(r1,'prepare',{mechanic:'Ana',notes:'Completo',result:'ready'});
    await taller(id,'ingresar',{notes:'Revisar antes de entregar'});
    await mover(r1,'deliver',{date:hoy,receiver:'Cliente'},409);
    await taller(id,'trabajo',{notes:'Ajuste',result:'Completo',mechanic:'Ana'});
    assert.equal(unidad(await taller(id,'liberar',{notes:'Revisado',mechanic:'Ana'})).state,'En preparación');
    await mover(r1,'cancel',{notes:'Cliente canceló',confirm:'si'});
    const r2 = await reservar(await cotizar(42));
    await taller(id,'ingresar',{notes:'Equipo pendiente de reparación'});
    const cancelada = await mover(r2,'cancel',{notes:'Cancelación con equipo en taller',confirm:'si'});
    assert.equal(unidad(cancelada).state,'En mantenimiento');
    await taller(id,'trabajo',{notes:'Reparación',result:'Funciona',mechanic:'Javier'});
    const cierre = await taller(id,'liberar',{notes:'Revisado y libre',mechanic:'Javier'});
    assert.equal(unidad(cierre).state,'Disponible');
    assert.equal(cierre.data.rentals.filter(r=>r.unit===id && r.status==='Cancelada').length,2);
  });
  if (process.env.TEST_BROWSER_CHANNEL) await t.test('pantallas de cuentas, inicio, historial e inventario con datos reales', async t => {
    const { chromium, expect } = await import('../frontend/node_modules/@playwright/test/index.mjs');
    const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL });
    t.after(() => browser.close());
    const page = await browser.newPage({ baseURL: new URL(base).origin, viewport: { width: 1280, height: 900 } });
    async function entrar(nombre, ruta) {
      await page.goto(ruta);
      await page.getByLabel('Usuario', {exact:true}).fill(nombre);
      await page.getByLabel('Contraseña', {exact:true}).fill(clave);
      await page.getByRole('button',{name:'Iniciar sesión'}).click();
    }
    const errores = [];
    page.on('pageerror', error => errores.push(error.message));
    const dir = new URL('./aceptacion-operativa/resultados/cierre/', import.meta.url);
    const { mkdir } = await import('node:fs/promises');
    const { fileURLToPath } = await import('node:url');
    await mkdir(dir,{recursive:true});
    const captura = (nombre) => page.screenshot({path:fileURLToPath(new URL(nombre,dir))});
    await entrar('encargado','/comercial/cuentas');
    await expect(page.getByRole('heading',{name:'Cuentas del equipo'})).toBeVisible();
    await page.getByLabel('Usuario',{exact:true}).fill('lectura-demo');
    await page.getByLabel('Contraseña inicial').fill(clave);
    await page.getByRole('button',{name:'Crear cuenta'}).click();
    const fila = page.getByRole('row').filter({has:page.getByRole('rowheader',{name:'lectura-demo'})});
    await expect(fila).toBeVisible();
    await fila.getByRole('combobox').selectOption('operador');
    await fila.getByRole('button',{name:'Guardar'}).click();
    await expect(page.getByRole('status')).toContainText('Cambios guardados');
    await fila.getByRole('combobox').selectOption('consulta');
    await fila.getByRole('button',{name:'Guardar'}).click();
    await expect(fila.getByRole('button',{name:'Guardar'})).toBeDisabled();
    await captura('01-cuentas.png');
    await page.getByRole('button',{name:'Cerrar sesión'}).click();
    await entrar('lectura-demo','/comercial/cuentas');
    await expect(page).toHaveURL(/comercial\/inicio/);
    await expect(page.getByRole('link',{name:'Cuentas del equipo'})).toHaveCount(0);
    for (const ancho of [1280,390]) {
      await page.setViewportSize({width:ancho,height:844});
      const perfil = page.locator('.comercial-menu__perfil');
      const etiqueta = await perfil.locator('span').boundingBox();
      const salir = await perfil.getByRole('button',{name:'Cerrar sesión'}).boundingBox();
      assert.ok(etiqueta && salir && salir.y >= etiqueta.y + etiqueta.height + 3);
    }
    await captura('02-inicio-movil.png');
    await page.setViewportSize({width:1280,height:900});
    const c = await cotizar(6);
    await pedir('POST','/operacion/equipos/1/unidades',operador,{unidad:'EQ-LIBRE'});
    const asignada = await asignar(c,'EQ-AGENDA');
    const actual = asignada.data.rentals.find(r=>r.unit==='EQ-AGENDA');
    await mover(actual.id,'prepare',{mechanic:'Ana',notes:'Lista',result:'ready'});
    await page.goto('/comercial/inicio');
    await expect(page.getByRole('link',{name:new RegExp('Entrega · EQ-AGENDA · ' + actual.id)})).toHaveAttribute('href','/comercial/rentas/'+actual.id);
    await expect(page.getByRole('link',{name:/Programado · EQ-PRUEBA/})).toHaveAttribute('href','/comercial/inventario/EQ-PRUEBA');
    const panel = (await pedir('GET','/operacion',operador)).data;
    const etapas = {
      'por-asignar': panel.reservaciones.length,
      preparacion: panel.rentals.filter(r => r.status === 'Apartado' || (r.status === 'En preparación' && !r.ready)).length,
      listos: panel.rentals.filter(r => r.status === 'En preparación' && r.ready).length,
      rentas: panel.rentals.filter(r => r.status === 'En renta').length,
      revision: panel.rentals.filter(r => r.status === 'En revisión').length,
      mantenimiento: panel.rentals.filter(r => r.status === 'En mantenimiento').length,
    };
    for (const [etapa,total] of Object.entries(etapas)) {
      const destino = '/comercial/operacion/' + etapa;
      const tarjeta = page.locator('.home-card').filter({has:page.locator('.home-count')}).and(page.locator('a[href="'+destino+'"]'));
      await expect(tarjeta.locator('.home-count')).toHaveText(String(total));
      await tarjeta.click();
      await expect(page).toHaveURL(new URL(destino,new URL(base).origin).href);
      if (!total) await expect(page.getByRole('heading',{name:/No hay/})).toBeVisible();
      await page.getByRole('link',{name:'Inicio',exact:true}).click();
    }
    const listos = page.getByRole('link').filter({has:page.getByRole('heading',{name:'Listos para entregar'})});
    await expect(listos.locator('.home-count')).toHaveText('1');
    await listos.click();
    await expect(page.getByText('EQ-AGENDA',{exact:false}).first()).toBeVisible();
    await page.getByRole('button',{name:/Ver detalle/}).click();
    await expect(page.getByRole('button',{name:'Registrar entrega'})).toHaveCount(0);
    await page.goto('/comercial/inventario');
    await page.getByRole('searchbox').fill('eq-libre');
    await page.getByRole('link',{name:'EQ-LIBRE'}).click();
    await expect(page.getByText('Sin rentas registradas')).toBeVisible();
    await expect(page.getByLabel('Movimiento',{exact:true})).toHaveCount(0);
    await page.getByRole('link',{name:'Volver al inventario'}).click();
    await expect(page.getByRole('searchbox')).toHaveValue('eq-libre');
    await page.getByRole('searchbox').fill('mÓnTacargas');
    await expect(page.getByRole('link',{name:'EQ-LIBRE'})).toBeVisible();
    await page.getByRole('searchbox').fill('zzzz-inexistente');
    await expect(page.getByRole('heading',{name:'Sin coincidencias'})).toBeVisible();
    await mover(actual.id,'deliver',{date:hoy,receiver:'Ana'});
    await mover(actual.id,'issue',{date:hoy,notes:'Revisar cable',mechanic:'Ana'});
    await page.goto('/comercial/inicio');
    await expect(page.getByRole('link',{name:new RegExp('Regreso · EQ-AGENDA · ' + actual.id)})).toHaveAttribute('href','/comercial/rentas/'+actual.id);
    await expect(page.getByRole('link',{name:/Falla · EQ-AGENDA · Revisar cable/})).toBeVisible();
    await mover(actual.id,'review',{date:hoy,notes:'Cable reparado',mechanic:'Ana',issueId:'1',result:'Resuelta'});
    await page.reload();
    await expect(page.getByRole('heading',{name:'Fallas y taller (1)'})).toBeVisible();
    await expect(page.getByRole('link',{name:/Falla · EQ-AGENDA · Revisar cable/})).toHaveCount(0);
    await page.goto('/comercial/historial');
    const cancelada = page.getByRole('row').filter({hasText:otra});
    for (const dato of ['Cancelada','EQ-OTRA','El cliente pospuso el trabajo','operador']) await expect(cancelada).toContainText(dato);
    await expect(page.getByRole('row').filter({hasText:renta})).toContainText('Cerrada');
    await page.goto('/comercial/rentas/'+renta);
    await page.getByRole('button',{name:'Documentos',exact:true}).click();
    await expect(page.getByRole('button',{name:'Cambiar foto'})).toHaveCount(0);
    await page.getByRole('button',{name:'Ver documento'}).click();
    await page.emulateMedia({media:'print'});
    await expect(page.locator('.responsiva')).toBeVisible();
    await expect(page.locator('.comercial-menu')).toBeHidden();
    await expect(page.locator('.document-toolbar')).toBeHidden();
    await captura('03-responsiva.png');
    await page.pdf({path:fileURLToPath(new URL('responsiva.pdf',dir)),format:'Letter'});
    assert.deepEqual(errores,[]);
  });

});
