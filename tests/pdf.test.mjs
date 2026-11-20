import test from 'node:test';
import assert from 'node:assert/strict';
import { generarPdfCotizacion } from '../backend/src/pdf-cotizacion.js';

const ejemplo = {
  folio: 'COT-0048', estado: 'Aprobada', origen: 'Panel',
  creadaEn: '2026-11-20T10:00:00.000Z', subtotal: 7200, envio: 1000, iva: 1312, total: 9512,
  cliente: {
    nombre: 'Ana Valenzuela Ochoa', empresa: 'Constructora Valle del Yaqui',
    telefono: '6441234567', correo: 'ana@example.com', municipio: 'Cajeme',
    direccion: 'Calle 5 de Febrero 120, Col. Centro',
  },
  lineas: [{
    equipo: 'Montacargas Toyota 8FG25', cantidad: 2,
    fechaInicio: '2026-11-25', fechaFin: '2026-11-27',
    dias: 3, tarifaDia: 1200, importe: 7200,
  }],
};

const paginas = (buffer) => (buffer.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;

test('HU-07 · genera un PDF válido de una página para la cotización aprobada', async () => {
  const pdf = await generarPdfCotizacion(ejemplo);
  assert.ok(pdf.subarray(0, 8).toString().startsWith('%PDF-'));
  assert.equal(paginas(pdf), 1);
  assert.ok(pdf.length > 3000);
});

test('HU-07 · muchas líneas caben en varias páginas, sin páginas vacías al final', async () => {
  const pdf = await generarPdfCotizacion({
    ...ejemplo, notas: 'Revisar acceso y horario antes de llevar los equipos. '.repeat(8),
    lineas: Array.from({ length: 26 }, (_, i) => ({
      ...ejemplo.lineas[0], equipo: `Equipo especial ${i + 1} con descripción más larga`,
    })),
  });
  assert.ok(paginas(pdf) >= 2);
  assert.ok(paginas(pdf) <= 4);
});
