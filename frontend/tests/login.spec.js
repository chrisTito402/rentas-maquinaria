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
  await page.getByRole('link', { name: '← Ver catálogo de maquinaria en renta' }).click();
  await expect(page).toHaveURL(/\/$/);
});

// HU-16 · Filtros por estado y origen en la bandeja (API simulada)
test('HU-16 · sin sesión manda a login; con sesión filtra por estado y origen y limpia filtros', async ({ page }) => {
  let activa = false;
  const cotizaciones = [
    { id: 1, folio: 'COT-0001', cliente: 'Ana Pérez', origen: 'Web', estado: 'Pendiente', total: 1000, creadaEn: '2026-11-20T10:00:00Z' },
    { id: 2, folio: 'COT-0002', cliente: 'Luis Soto', origen: 'Panel', estado: 'Aprobada', total: 2000, creadaEn: '2026-11-20T09:00:00Z' },
    { id: 3, folio: 'COT-0003', cliente: 'Eva Ruiz', origen: 'Web', estado: 'Aprobada', total: 3000, creadaEn: '2026-11-20T08:00:00Z' },
  ];
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/auth/login') activa = true;
    if (url.pathname === '/api/auth/sesion' || url.pathname === '/api/auth/login') {
      return route.fulfill({ status: activa ? 200 : 401, json: activa ? { usuario: { id: 1, nombre: 'admin' } } : { error: 'Inicia sesión.' } });
    }
    if (url.pathname === '/api/cotizaciones') {
      const estado = url.searchParams.get('estado');
      const origen = url.searchParams.get('origen');
      return route.fulfill({ json: cotizaciones.filter((c) => (!estado || c.estado === estado) && (!origen || c.origen === origen)) });
    }
    return route.fulfill({ json: [] });
  });

  await page.goto('/comercial/cotizaciones');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Usuario', { exact: true }).fill('admin');
  await page.getByLabel('Contraseña', { exact: true }).fill('clave-de-prueba');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await page.goto('/comercial/cotizaciones');

  const filas = page.locator('tbody tr');
  await expect(filas).toHaveCount(3);
  await page.getByRole('button', { name: 'Aprobadas · 2' }).click();
  await expect(filas).toHaveCount(2);
  await expect(filas.filter({ hasText: 'Pendiente' })).toHaveCount(0);

  await page.getByLabel('Filtrar por origen').selectOption('Panel');
  await expect(filas).toHaveCount(1);
  await expect(filas).toContainText('COT-0002');

  await page.getByRole('button', { name: /^Rechazadas/ }).click();
  await expect(page.getByText('No hay cotizaciones con esos filtros.')).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(filas).toHaveCount(3);
});
