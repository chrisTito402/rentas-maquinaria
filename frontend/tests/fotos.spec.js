import { test, expect } from '@playwright/test';

const foto = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/55/Toyota_forklift_vehicle.jpg/960px-Toyota_forklift_vehicle.jpg';
const equipo = {
  id: 1, nombre: 'Montacargas Toyota 8FG25', tipo: 'Montacargas', modelo: '8FG25',
  caracteristicas: 'Gas LP · Elevación máxima 4.80 m', tarifaDia: 1200, foto, disponible: true,
};
const noDisponible = { ...equipo, id: 2, nombre: 'Montacargas no disponible', disponible: false };

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/sesion', route => route.fulfill({ status: 401, json: { error: 'Sin sesión' } }));
  await page.route('**/api/equipos', route => route.fulfill({ json: [equipo, noDisponible] }));
  await page.route('**/api/equipos/2', route => route.fulfill({ json: noDisponible }));
  await page.route('**/api/equipos/2/ocupadas', route => route.fulfill({ json: [] }));
});

test('HU-01b · catálogo con fotos externas y ambos estados en escritorio y móvil', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const tarjetas = page.locator('.equipo-tarjeta');
  await expect(tarjetas).toHaveCount(2);
  await expect(tarjetas.nth(0).getByText('Disponible', { exact: true })).toBeVisible();
  await expect(tarjetas.nth(1).getByText('No disponible', { exact: true })).toBeVisible();
  const imagen = tarjetas.nth(0).locator('.maquina img');
  await expect(imagen).toHaveAttribute('src', foto);
  await expect.poll(() => imagen.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await imagen.evaluate(img => getComputedStyle(img).objectFit)).toBe('cover');
  await page.screenshot({ path: 'test-results/catalogo-fotos-escritorio.png', fullPage: true });

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(tarjetas.nth(1).getByText('No disponible', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/catalogo-fotos-movil.png', fullPage: true });
  await page.getByRole('link', { name: 'Créditos y licencias' }).click();
  await expect(page.getByRole('heading', { name: 'Créditos de fotografías' })).toBeVisible();
});

test('HU-01b · la ficha muestra la foto de la BD y No disponible tras recargar', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/equipos/2');
  await expect(page.locator('.ficha-disponibilidad')).toHaveText('No disponible');
  const imagen = page.locator('.ficha-imagen .maquina img');
  await expect(imagen).toHaveAttribute('src', foto);
  await expect.poll(() => imagen.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.reload();
  await expect(page.locator('.ficha-disponibilidad')).toHaveText('No disponible');
  await expect.poll(() => imagen.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/ficha-fotos-movil.png', fullPage: true });
});
