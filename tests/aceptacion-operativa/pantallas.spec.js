import { test, expect } from '../../frontend/pruebas-navegador.js';
import { prepararAPI } from './soporte/api.mjs';

test.afterEach(async ({ page }, info) => {
  const ruta = info.outputPath('pantalla.png');
  await page.screenshot({ path: ruta, fullPage: true });
  await info.attach('Pantalla al terminar', { path: ruta, contentType: 'image/png' });
});

test('OP-01 | aprobar cotización permite asignar sin preparar ni entregar automáticamente', async ({ page }) => {
  const mock = await prepararAPI(page);
  await page.goto('/comercial/cotizaciones');
  await page.getByRole('link', { name: 'COT-0001', exact: true }).click();
  await page.getByRole('button', { name: 'Aprobar cotización' }).click();
  await expect(page.getByRole('heading', { name: 'Cotización aprobada' })).toBeVisible();
  await expect(page).toHaveURL(/cotizaciones\/1$/);
  expect(mock.estado().rentals).toHaveLength(0);
  await page.getByRole('link', { name: 'Continuar a asignación' }).click();
  await expect(page.locator('details.assignment-card')).toHaveAttribute('open', '');
  await page.locator('input[name="unidad"]').nth(0).fill('MC-01');
  await page.locator('input[name="unidad"]').nth(1).fill('MC-02');
  await page.getByRole('button', { name: 'Guardar asignación' }).click();
  await expect(page.getByRole('heading', { name: 'Unidades asignadas' })).toBeVisible();
  await expect(page).toHaveURL(/por-asignar/);
  await expect(page.getByRole('link', { name: 'Revisar MC-01' })).toBeVisible();
  expect(mock.estado().rentals.every(r => r.status === 'Apartado' && !r.ready && !r.delivery)).toBe(true);
  expect(mock.errores).toEqual([]);
});

test('OP-08 | generar y visualizar carta responsiva en modo impresión', async ({ page }) => {
  const mock = await prepararAPI(page);
  mock.iniciarEstado('lista');
  await page.goto('/comercial/rentas/R-001');
  await page.getByRole('button', { name: 'Documentos', exact: true }).click();
  await page.getByRole('button', { name: 'Generar carta responsiva' }).click();
  await page.getByLabel('Marca', { exact: true }).fill('Marca');
  await page.getByLabel('Serie', { exact: true }).fill('S-1');
  await page.getByRole('button', { name: 'Generar responsiva', exact: true }).click();
  await page.getByRole('button', { name: 'Ver documento', exact: false }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.comercial-menu')).toBeHidden();
  await expect(page.locator('.document-toolbar')).toBeHidden();
  await expect(page.locator('.flow-notice')).toBeHidden();
  await expect(page.locator('.responsiva')).toBeVisible();
  expect(mock.estado().rentals[0].document.brand).toBe('Marca');
  expect(mock.estado().rentals[0].document.serial).toBe('S-1');
  const ruta = test.info().outputPath('responsiva-impresion.png');
  await page.screenshot({ path: ruta, fullPage: true });
  await test.info().attach('Responsiva en impresión', { path: ruta, contentType: 'image/png' });
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: 'Cerrar documento' }).click();
  expect(mock.errores).toEqual([]);
});

test('OP-10 | entrega actualiza renta y unidad, conserva URL y sobrevive a recarga', async ({ page }) => {
  const mock = await prepararAPI(page);
  mock.iniciarEstado('lista');
  await page.goto('/comercial/rentas/R-001');
  await page.getByRole('button', { name: 'Registrar entrega', exact: true }).click();
  await page.getByLabel('Nombre de quien recibe con el cliente').fill('Cliente');
  await page.getByRole('button', { name: 'Confirmar entrega' }).click();
  await expect(page.getByRole('heading', { name: 'Cambio guardado' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Registrar devolución', exact: true })).toBeVisible();
  expect(mock.estado().units[0].state).toBe('En renta');
  expect(mock.estado().rentals[0].status).toBe('En renta');
  expect(mock.estado().rentals[0].delivery.receiver).toBe('Cliente');
  await page.reload();
  await expect(page).toHaveURL(/rentas\/R-001$/);
  await expect(page.getByRole('heading', { name: 'Montacargas', exact: true, level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Registrar devolución', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'MC-02 · Preparación' })).toBeVisible();
  expect(mock.errores).toEqual([]);
});

test('OP-12 | cierre libera inventario, conserva eventos y aparece en historial y cotización', async ({ page }) => {
  const mock = await prepararAPI(page);
  mock.iniciarEstado('entregada');
  await page.goto('/comercial/rentas/R-001');
  await page.getByRole('button', { name: 'Registrar devolución', exact: true }).click();
  await page.getByLabel('Nombre de quien recibe el regreso').fill('Almacén');
  await page.getByRole('button', { name: 'Guardar registro' }).click();
  expect(mock.estado().rentals[0].status).toBe('En revisión');
  expect(mock.estado().units[0].state).toBe('En revisión');
  await page.getByRole('button', { name: 'Registrar estado final', exact: true }).click();
  await page.getByLabel('Mecánico que revisó').fill('Luis');
  await page.getByLabel('Resultado de la revisión final').fill('Sin daños');
  await page.getByRole('button', { name: 'Guardar registro' }).click();
  await expect(page.getByRole('heading', { name: 'Renta terminada' })).toBeVisible();
  const data = mock.estado();
  expect(data.units[0].state).toBe('Disponible');
  expect(data.rentals[0].status).toBe('Cerrada');
  expect(data.rentals[0].events).toHaveLength(6);
  expect(data.rentals[0].document.hours).toBe(10);
  await page.getByRole('link', { name: 'Historial', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'MC-01 · R-001' })).toBeVisible();
  await page.getByRole('link', { name: 'Cotizaciones', exact: true }).click();
  await page.getByRole('link', { name: 'COT-0001', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Seguimiento en Operación' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'MC-01 · Cerrada' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'MC-02 · Preparación' })).toBeVisible();
  expect(mock.errores).toEqual([]);
});

test('OP-13 | guardar con error conserva campos y permite reintentar sin avance falso', async ({ page }) => {
  const mock = await prepararAPI(page);
  mock.iniciarAsignada();
  await page.goto('/comercial/rentas/R-001');
  await page.getByRole('button', { name: 'Registrar preparación' }).click();
  await page.getByLabel('Mecánico que revisó').fill('Luis');
  await page.getByRole('combobox').selectOption('ready');
  await page.getByRole('textbox', { name: 'Resultado de la revisión del mecánico' }).fill('Equipo revisado y listo');
  mock.fallarSiguiente();
  await page.getByRole('button', { name: 'Guardar registro' }).click();
  await expect(page.getByRole('alert')).toContainText('No se pudo guardar');
  await expect(page.getByLabel('Mecánico que revisó')).toHaveValue('Luis');
  await expect(page.getByRole('textbox', { name: 'Resultado de la revisión del mecánico' })).toHaveValue('Equipo revisado y listo');
  expect(mock.estado().rentals[0].status).toBe('Apartado');
  await page.getByRole('button', { name: 'Guardar registro' }).click();
  await expect(page.getByRole('heading', { name: 'Cambio guardado' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Registrar entrega', exact: true })).toBeVisible();
  expect(mock.estado().rentals[0].ready).toBe(true);
  expect(mock.errores).toEqual([]);
});

test('OP-09 | fotografía de responsiva recuperable después de recargar', async ({ page }) => {
  const mock = await prepararAPI(page);
  mock.iniciarAsignada();
  await page.goto('/comercial/rentas/R-001');
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


test('OP-14 | navegación móvil, accesos anteriores y recarga de enlaces privados', async ({ page }) => {
  const mock = await prepararAPI(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/equipos');
  await expect(page).toHaveURL(/comercial\/inventario$/);
  await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cotizaciones', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Operación', exact: true }).click();
  await expect(page).toHaveURL(/comercial\/operacion\/por-asignar$/);
  await expect(page.getByRole('link', { name: 'Operación', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.reload();
  await expect(page).toHaveURL(/por-asignar$/);
  await page.goto('/panel/cotizaciones/1');
  await expect(page).toHaveURL(/comercial\/cotizaciones\/1$/);
  await expect(page.getByRole('heading', { name: /COT-0001/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/gestion/operacion/rentas?x=1');
  await expect(page).toHaveURL(/comercial\/operacion\/rentas\?x=1$/);
  await page.goto('/gestion/inicio');
  await expect(page).toHaveURL(/comercial\/inicio$/);
  await expect(page.getByRole('heading', { name: 'Una renta, paso a paso' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(mock.errores).toEqual([]);
});


test('OP-15 | calendario y formularios utilizables con teclado en móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const mock = await prepararAPI(page);
  mock.iniciarAsignada();
  await page.goto('/comercial/rentas/R-001');
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
