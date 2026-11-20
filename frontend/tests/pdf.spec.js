import { test, expect } from '@playwright/test';

const cotizacion = {
  id: 48, folio: 'COT-0048', origen: 'Panel', estado: 'Pendiente',
  creadaEn: '2026-11-20T10:00:00.000Z', notas: '',
  subtotal: 7200, envio: 1000, iva: 1312, total: 9512,
  cliente: {
    nombre: 'Ana Valenzuela Ochoa', empresa: 'Constructora Valle del Yaqui',
    telefono: '6441234567', correo: 'ana@example.com', municipio: 'Cajeme',
    direccion: 'Calle 5 de Febrero 120, Col. Centro',
  },
  lineas: [{
    id: 1, equipo: 'Montacargas Toyota 8FG25', cantidad: 2,
    fechaInicio: '2026-11-25', fechaFin: '2026-11-27',
    dias: 3, tarifaDia: 1200, importe: 7200,
  }],
};

async function preparar(page, estadoInicial) {
  let estado = estadoInicial;
  await page.route('**/api/auth/sesion', route => route.fulfill({
    json: { usuario: { id: 1, nombre: 'Administrador', rol: 'admin' } },
  }));
  await page.route('**/api/operacion', route => route.fulfill({ json: { rentals: [] } }));
  await page.route('**/api/cotizaciones/48', route => route.fulfill({
    json: { ...cotizacion, estado },
  }));
  await page.route('**/api/cotizaciones/48/aprobar', route => {
    estado = 'Aprobada';
    return route.fulfill({ json: { id: 48, folio: cotizacion.folio, estado } });
  });
  await page.route('**/api/cotizaciones/48/pdf', route => route.fulfill({
    contentType: 'application/pdf',
    headers: { 'Content-Disposition': 'attachment; filename="COT-0048.pdf"' },
    body: Buffer.from('%PDF-1.3\n%%EOF'),
  }));
}

test('HU-07 · los botones aparecen al aprobar y siguen visibles al recargar', async ({ page }) => {
  await preparar(page, 'Pendiente');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/comercial/cotizaciones/48');
  await expect(page.getByRole('button', { name: 'Descargar PDF' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Enviar por WhatsApp' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Aprobar cotización' }).click();
  await expect(page.getByRole('heading', { name: 'Cotización aprobada' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Descargar PDF' })).toBeVisible();
  const whatsapp = page.getByRole('link', { name: 'Enviar por WhatsApp' });
  await expect(whatsapp).toHaveAttribute('target', '_blank');
  expect(new URL(await whatsapp.getAttribute('href')).pathname).toBe('/526441234567');

  const descarga = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar PDF' }).click();
  expect((await descarga).suggestedFilename()).toBe('COT-0048.pdf');
  await page.screenshot({ path: 'test-results/pdf-aprobada-escritorio.png', fullPage: true });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Descargar PDF' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Enviar por WhatsApp' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/pdf-aprobada-movil.png', fullPage: true });
});
