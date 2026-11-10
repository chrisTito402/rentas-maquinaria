import { test, expect } from '@playwright/test';
import { applyOperation } from '../../compartido/operacion/operaciones.js';
import { asignarUnidades } from '../../backend/src/reservaciones.js';

async function prepararAPI(page) {
  const cliente = { nombre: 'Constructora del Norte', telefono: '6621234567', correo: 'obra@example.com', direccion: 'Avenida principal 10', municipio: 'Hermosillo', empresa: 'Obras del Norte' };
  const linea = { id: 1, equipoId: 1, equipo: 'Montacargas', modelo: 'M1', tipo: 'Carga', cantidad: 2, inicio: '2026-11-09', fin: '2026-11-15', fechaInicio: '2026-11-09', fechaFin: '2026-11-15', dias: 7, tarifaDia: 100, importe: 1400 };
  let cot = { id: 1, folio: 'COT-0001', estado: 'Pendiente', origen: 'Web', cliente, creadaEn: '2026-11-09T12:00:00Z', lineas: [linea], subtotal: 1400, iva: 224, total: 1624 };
  let data = { units: [], rentals: [], reservaciones: [], catalogo: [{ id: 1, nombre: 'Montacargas', modelo: 'M1', tipo: 'Carga' }] };
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  let falloAccion = false;
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    let body;
    let status = 200;
    if (url.pathname === '/api/cotizaciones/1/aprobar') { cot.estado = 'Aprobada'; data.reservaciones = [cot]; body = { id: 1, folio: cot.folio, estado: 'Aprobada' }; }
    else if (url.pathname === '/api/cotizaciones/1') body = cot;
    else if (url.pathname === '/api/cotizaciones') body = [{ ...cot, cliente: cliente.nombre, fechaInicio: linea.inicio, fechaFin: linea.fin }];
    else if (url.pathname === '/api/operacion/reservaciones/1/asignar') {
      data = { ...data, ...asignarUnidades(data, cot, route.request().postDataJSON().unidades), reservaciones: [] }; body = data;
    } else if (url.pathname === '/api/operacion/acciones') {
      if (falloAccion) { status = 409; body = { error: 'No se pudo guardar. Intenta de nuevo.' }; falloAccion = false; }
      else { const { id, accion, campos } = route.request().postDataJSON(); data = { ...data, ...applyOperation(data, id, accion, campos) }; body = data; }
    } else if (url.pathname === '/api/operacion') body = data;
    else if (url.pathname === '/api/equipos') body = [];
    else { status = 404; body = { error: 'Ruta no simulada' }; }
    await route.fulfill({ status, json: body });
  });
  return {
    errores,
    fallarSiguiente: () => { falloAccion = true; },
    iniciarAsignada: () => { cot.estado = 'Aprobada'; data = { ...data, ...asignarUnidades(data, cot, ['MC-01', 'MC-02']), reservaciones: [] }; },
  };
}

test('cotización a cierre, con avance manual, URL persistente y unidades independientes', async ({ page }) => {
  const mock = await prepararAPI(page);
  await page.goto('/gestion/cotizaciones');
  await page.getByRole('link', { name: 'Revisar →', exact: true }).click();
  await page.getByRole('button', { name: 'Aprobar cotización' }).click();
  await expect(page.getByRole('heading', { name: 'Cotización aprobada' })).toBeVisible();
  await expect(page).toHaveURL(/cotizaciones\/1$/);
  await page.getByRole('link', { name: 'Continuar a asignación' }).click();
  await expect(page.locator('details.assignment-card')).toHaveAttribute('open', '');
  await page.locator('input[name="unidad"]').nth(0).fill('MC-01');
  await page.locator('input[name="unidad"]').nth(1).fill('MC-02');
  await page.getByRole('button', { name: 'Guardar asignación' }).click();
  await expect(page.getByRole('heading', { name: 'Unidades asignadas' })).toBeVisible();
  await expect(page).toHaveURL(/por-asignar/);
  await page.getByRole('link', { name: 'Revisar MC-01' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Montacargas', exact: true, level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Registrar preparación' }).click();
  await page.getByLabel('Mecánico que revisó').fill('Luis');
  await page.getByRole('combobox').selectOption('ready');
  await page.getByRole('textbox', { name: 'Resultado de la revisión del mecánico' }).fill('Equipo revisado y listo');
  mock.fallarSiguiente();
  await page.getByRole('button', { name: 'Guardar registro' }).click();
  await expect(page.getByRole('alert')).toContainText('No se pudo guardar');
  await expect(page.getByLabel('Mecánico que revisó')).toHaveValue('Luis');
  await page.getByRole('button', { name: 'Guardar registro' }).click();
  await expect(page.getByRole('heading', { name: 'Cambio guardado' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Registrar entrega', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'MC-02 · Preparación' })).toBeVisible();
  await page.getByRole('button', { name: 'Documentos', exact: true }).click();
  await page.getByRole('button', { name: 'Generar carta responsiva' }).click();
  await page.getByLabel('Marca', { exact: true }).fill('Marca');
  await page.getByLabel('Serie', { exact: true }).fill('S-1');
  await page.getByRole('button', { name: 'Generar responsiva', exact: true }).click();
  await page.getByRole('button', { name: 'Ver documento', exact: false }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.responsiva')).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: 'Cerrar documento' }).click();
  await page.getByRole('button', { name: 'Resumen', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar entrega', exact: true }).click();
  await page.getByLabel('Nombre de quien recibe con el cliente').fill('Cliente');
  await page.getByRole('button', { name: 'Confirmar entrega' }).click();
  await page.getByRole('button', { name: 'Registrar devolución', exact: true }).click();
  await page.getByLabel('Nombre de quien recibe el regreso').fill('Almacén');
  await page.getByRole('button', { name: 'Guardar registro' }).click();
  await page.getByRole('button', { name: 'Registrar estado final', exact: true }).click();
  await page.getByLabel('Mecánico que revisó').fill('Luis');
  await page.getByLabel('Resultado de la revisión final').fill('Sin daños');
  await page.getByRole('button', { name: 'Guardar registro' }).click();
  await expect(page.getByRole('heading', { name: 'Renta terminada' })).toBeVisible();
  await page.getByRole('link', { name: 'Historial', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'MC-01 · R-001' })).toBeVisible();
  await page.getByRole('link', { name: 'Cotizaciones', exact: true }).click();
  await page.getByRole('combobox', { name: 'Mostrar', exact: true }).selectOption('Aprobada');
  await page.getByRole('link', { name: 'Ver seguimiento' }).click();
  await expect(page.getByRole('link', { name: 'MC-01 · Cerrada' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'MC-02 · Preparación' })).toBeVisible();
  expect(mock.errores).toEqual([]);
});

test('guarda una foto de la responsiva y la vuelve a abrir después de recargar', async ({ page }) => {
  const mock = await prepararAPI(page);
  mock.iniciarAsignada();
  await page.goto('/gestion/rentas/R-001');
  await page.getByRole('button', { name: 'Documentos', exact: true }).click();
  await page.getByRole('button', { name: 'Subir fotografía' }).click();
  const dialog = page.getByRole('dialog', { name: 'Foto de la responsiva' });
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 48;
    const context = canvas.getContext('2d');
    context.fillStyle = 'blue';
    context.fillRect(0, 0, 64, 48);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await dialog.locator('input[type="file"]:not([capture])').setInputFiles({
    name: 'responsiva.png',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(png, 'base64'),
  });
  await expect(dialog.getByRole('img')).toHaveJSProperty('naturalWidth', 64);
  await dialog.getByRole('button', { name: 'Guardar fotografía' }).click();
  await expect(page.getByRole('heading', { name: 'Cambio guardado' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Documentos', exact: true }).click();
  await page.getByRole('button', { name: 'Ver fotografía' }).click();
  await expect(page.getByRole('img', { name: 'Responsiva de R-001' })).toHaveJSProperty('naturalWidth', 64);
  expect(mock.errores).toEqual([]);
});

test('preparación detenida permite retomar la revisión sin entregar el equipo', async ({ page }) => {
  const mock = await prepararAPI(page);
  mock.iniciarAsignada();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/gestion/rentas/R-001');
  await page.getByRole('button', { name: 'Registrar preparación' }).click();
  await page.getByLabel('Mecánico que revisó').fill('Luis');
  await page.getByRole('combobox').selectOption('maintenance');
  await page.getByRole('textbox', { name: 'Resultado de la revisión del mecánico' }).fill('Necesita reparación');
  await page.getByRole('button', { name: 'Guardar registro' }).click();
  await expect(page.getByRole('button', { name: 'Retomar preparación' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Registrar entrega', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Retomar preparación' }).click();
  await page.getByRole('textbox', { name: 'Resultado de la revisión del mecánico' }).fill('Reparación terminada, falta revisión');
  await page.getByRole('button', { name: 'Guardar registro' }).click();
  await expect(page.getByRole('button', { name: 'Registrar preparación' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Registrar preparación' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/renta-mobile.png', fullPage: true });
  expect(mock.errores).toEqual([]);
});

test('menú estable en móvil, accesos anteriores y sin desbordamiento de pantalla', async ({ page }) => {
  const mock = await prepararAPI(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/equipos');
  await expect(page).toHaveURL(/gestion\/inventario$/);
  await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir menú de gestión' }).click();
  await expect(page.getByRole('link', { name: 'Cotizaciones', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Abrir menú de gestión' })).toBeFocused();
  await page.getByRole('button', { name: 'Abrir menú de gestión' }).click();
  await page.getByRole('link', { name: 'Operación', exact: true }).click();
  await expect(page).toHaveURL(/gestion\/operacion\/por-asignar$/);
  await page.goto('/panel/cotizaciones/1');
  await expect(page).toHaveURL(/gestion\/cotizaciones\/1$/);
  await expect(page.getByRole('heading', { name: /COT-0001/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/gestion/inicio');
  await expect(page.getByRole('heading', { name: 'Una renta, paso a paso' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/gestion-mobile.png', fullPage: true });
  expect(mock.errores).toEqual([]);
});

test('error de carga y recuperación sin perder el menú de gestión', async ({ page }) => {
  let fallo = true;
  await page.route('**/api/operacion', route => route.fulfill({ status: fallo ? 500 : 200, json: fallo ? { error: 'Sin conexión' } : { units: [], rentals: [], reservaciones: [], catalogo: [] } }));
  await page.goto('/gestion/inicio');
  await expect(page.getByRole('alert')).toContainText('No se pudo actualizar');
  await expect(page.getByRole('link', { name: 'Cotizaciones', exact: true })).toBeVisible();
  fallo = false;
  await page.getByRole('button', { name: 'Volver a intentar' }).click();
  await expect(page.getByRole('heading', { name: 'Una renta, paso a paso' })).toBeVisible();
  await page.screenshot({ path: 'test-results/gestion-desktop.png', fullPage: true });
});

test('el calendario y los formularios se cierran con teclado o al pulsar fuera', async ({ page }) => {
  const mock = await prepararAPI(page);
  mock.iniciarAsignada();
  await page.goto('/gestion/rentas/R-001');
  const prepare = page.getByRole('button', { name: 'Registrar preparación', exact: true });
  await prepare.click();
  await page.getByLabel('Mecánico que revisó').fill('Luis');
  await page.getByRole('combobox').selectOption('ready');
  await page.getByRole('textbox', { name: 'Resultado de la revisión del mecánico' }).fill('Equipo listo');
  await page.getByRole('button', { name: 'Guardar registro', exact: true }).click();

  const deliver = page.getByRole('button', { name: 'Registrar entrega', exact: true });
  await deliver.click();
  const dialog = page.getByRole('dialog', { name: 'Registrar entrega', exact: true });
  const date = dialog.getByRole('button', { name: /^Fecha / });
  await date.click();
  const calendar = page.getByRole('dialog', { name: 'Elegir fecha' });
  await expect(calendar).toBeVisible();
  const selected = calendar.getByRole('button', { pressed: true });
  const label = await selected.getAttribute('aria-label');
  await expect(selected).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(calendar).toHaveCount(0);
  await expect(date).not.toHaveAccessibleName('Fecha ' + label);
  await date.click();
  await page.keyboard.press('Escape');
  await expect(calendar).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await expect(date).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(deliver).toBeFocused();
  await deliver.click();
  await dialog.getByRole('textbox', { name: 'Nombre de quien recibe con el cliente' }).click();
  await expect(dialog).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar ventana', exact: true }).click({ position: { x: 3, y: 3 } });
  await expect(dialog).toHaveCount(0);
  expect(mock.errores).toEqual([]);
});
