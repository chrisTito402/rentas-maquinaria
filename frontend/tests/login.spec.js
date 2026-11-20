import { test, expect } from '@playwright/test';

test('diseño aprobado, error recuperable, destino privado y cierre de sesión', async ({ page }) => {
  let activa = false;
  let fallo = true;
  await page.route('**/api/**', async route => {
    const ruta = new URL(route.request().url()).pathname;
    if (ruta === '/api/auth/login') {
      if (fallo) { fallo = false; return route.fulfill({ status: 401, json: { error: 'Usuario o contraseña incorrectos.' } }); }
      activa = true;
    }
    if (ruta === '/api/auth/logout') activa = false;
    if (ruta === '/api/auth/sesion' || ruta === '/api/auth/login') return route.fulfill({ status: activa ? 200 : 401, json: activa ? { usuario: { id: 1, nombre: 'operativa' } } : { error: 'Inicia sesión.' } });
    if (ruta === '/api/auth/logout') return route.fulfill({ json: { ok: true } });
    return route.fulfill({ json: { units: [], rentals: [], reservaciones: [], catalogo: [] } });
  });
  await page.goto('/admin/equipos');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await page.getByLabel('Usuario', { exact: true }).fill('operativa');
  await page.getByLabel('Contraseña', { exact: true }).fill('clave-de-prueba');
  await page.getByRole('button', { name: 'Mostrar' }).click();
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Usuario o contraseña incorrectos.');
  await expect(page.getByLabel('Usuario', { exact: true })).toHaveValue('operativa');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/\/comercial\/inventario$/);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('fallo de red conserva el usuario y permite reintentar; catálogo público accesible', async ({ page }) => {
  await page.route('**/api/auth/sesion', route => route.fulfill({ status: 401, json: {} }));
  await page.route('**/api/auth/login', route => route.abort());
  await page.route('**/api/equipos', route => route.fulfill({ json: [] }));
  await page.goto('/login');
  await page.getByLabel('Usuario', { exact: true }).fill('operativa');
  await page.getByLabel('Contraseña', { exact: true }).fill('clave-de-prueba');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('No se pudo conectar');
  await expect(page.getByLabel('Usuario', { exact: true })).toHaveValue('operativa');
  await page.getByRole('link', { name: 'Volver al catálogo' }).click();
  await expect(page).toHaveURL(/\/$/);
});
