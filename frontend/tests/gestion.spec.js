import { test, expect } from '@playwright/test';
import { prepararAPI } from '../../tests/aceptacion-operativa/soporte/api.mjs';

test('preparación detenida permite retomar la revisión sin entregar el equipo', async ({ page }) => {
  const mock = await prepararAPI(page);
  mock.iniciarAsignada();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/comercial/rentas/R-001');
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


test('error de carga y recuperación sin perder el menú del panel', async ({ page }) => {
  await page.route('**/api/auth/sesion', route => route.fulfill({ json: { usuario: { id: 1, nombre: 'operativa', rol: 'operador' } } }));
  let fallo = true;
  await page.route('**/api/operacion', route => route.fulfill({ status: fallo ? 500 : 200, json: fallo ? { error: 'Sin conexión' } : { units: [], rentals: [], reservaciones: [], catalogo: [] } }));
  await page.goto('/comercial/inicio');
  await expect(page.getByRole('alert')).toContainText('No se pudo actualizar');
  await expect(page.getByRole('link', { name: 'Cotizaciones', exact: true })).toBeVisible();
  fallo = false;
  await page.getByRole('button', { name: 'Volver a intentar' }).click();
  await expect(page.getByRole('heading', { name: 'Inicio', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/gestion-desktop.png', fullPage: true });
});
