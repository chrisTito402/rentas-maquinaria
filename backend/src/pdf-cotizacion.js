import { readFile } from 'node:fs/promises';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { dinero, fecha } from '../../compartido/formato.js';

const COLOR = {
  tinta: '#0f172a',
  secundario: '#475569',
  tenue: '#64748b',
  borde: '#e2e8f0',
  fondo: '#f8fafc',
  naranja: '#f97316',
  naranjaSuave: '#fff7ed',
};
const MARGEN = 42;
const LIMITE = 772;
let logo;

const icono = () => {
  logo ??= readFile(new URL('../../frontend/public/img/iconos/logo.svg', import.meta.url))
    .then((svg) => sharp(svg).resize(68, 52).png().toBuffer());
  return logo;
};

const texto = (valor) => String(valor ?? '');

function medirCampo(doc, valor, ancho) {
  doc.font('Helvetica').fontSize(10);
  return Math.max(36, 13 + doc.heightOfString(texto(valor), { width: ancho, lineGap: 2 }));
}

function campo(doc, etiqueta, valor, x, y, ancho) {
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR.tenue)
    .text(etiqueta.toUpperCase(), x, y, { width: ancho });
  doc.font('Helvetica').fontSize(10).fillColor(COLOR.tinta)
    .text(texto(valor), x, y + 13, { width: ancho, lineGap: 2 });
}

function encabezadoTabla(doc, y) {
  doc.roundedRect(MARGEN, y, 511, 31, 5).fill(COLOR.fondo);
  const columnas = [
    ['EQUIPO', 52, 158], ['FECHAS', 214, 93], ['CANT.', 307, 35],
    ['DÍAS', 347, 29], ['TARIFA / DÍA', 379, 74], ['IMPORTE', 456, 87],
  ];
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR.secundario);
  for (const [nombre, x, ancho] of columnas) {
    doc.text(nombre, x, y + 10, { width: ancho, align: x > 300 ? 'right' : 'left' });
  }
  return y + 31;
}

function nuevaPagina(doc, folio) {
  doc.addPage();
  doc.font('Helvetica-Bold').fontSize(12).fillColor(COLOR.tinta)
    .text(`Cotización ${folio} · continuación`, MARGEN, 45, { width: 511 });
  doc.moveTo(MARGEN, 70).lineTo(553, 70).strokeColor(COLOR.borde).stroke();
  return 88;
}

function asegurarEspacio(doc, y, alto, folio) {
  return y + alto > LIMITE ? nuevaPagina(doc, folio) : y;
}

function dibujar(doc, cotizacion, logoPng) {
  const cliente = cotizacion.cliente;
  const folio = texto(cotizacion.folio);
  doc.roundedRect(MARGEN, 38, 44, 44, 9).fill(COLOR.naranja);
  doc.image(logoPng, MARGEN + 7, 48, { width: 30, height: 23 });
  doc.font('Helvetica-Bold').fontSize(16).fillColor(COLOR.tinta)
    .text('RENTA DE MAQUINARIA', 98, 42, { width: 290 });
  doc.font('Helvetica').fontSize(9).fillColor(COLOR.secundario)
    .text('CD. OBREGÓN · SONORA', 98, 64, { width: 280 });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR.naranja)
    .text('COTIZACIÓN FORMAL', 385, 42, { width: 168, align: 'right' });
  doc.font('Helvetica-Bold').fontSize(16).fillColor(COLOR.tinta)
    .text(folio, 395, 59, { width: 158, align: 'right' });
  doc.moveTo(MARGEN, 102).lineTo(553, 102).strokeColor(COLOR.borde).stroke();

  doc.font('Helvetica-Bold').fontSize(20).fillColor(COLOR.tinta)
    .text(`Cotización ${folio}`, MARGEN, 119, { width: 511 });
  const recibida = new Date(cotizacion.creadaEn).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Hermosillo',
  });
  doc.font('Helvetica').fontSize(10).fillColor(COLOR.secundario)
    .text(`Aprobada · Solicitud recibida el ${recibida} · Origen: ${cotizacion.origen}`, MARGEN, 150, { width: 511 });

  const ancho = 228;
  const nombre = cliente.nombre;
  const empresa = cliente.empresa || 'Particular';
  const telefono = cliente.telefono;
  const correo = cliente.correo;
  const destino = `${cliente.municipio} · ${cliente.direccion}`;
  const alturaPrimera = Math.max(medirCampo(doc, nombre, ancho), medirCampo(doc, empresa, ancho));
  const alturaSegunda = Math.max(medirCampo(doc, telefono, ancho), medirCampo(doc, correo, ancho));
  const alturaDestino = medirCampo(doc, destino, 475);
  const altoBloque = 44 + alturaPrimera + alturaSegunda + alturaDestino;
  const cajaY = 173;
  doc.roundedRect(MARGEN, cajaY, 511, altoBloque, 9).fill(COLOR.fondo);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR.secundario)
    .text('DATOS DEL CLIENTE', MARGEN + 14, cajaY + 13, { width: 480 });
  let campoY = cajaY + 34;
  campo(doc, 'Contacto', nombre, MARGEN + 14, campoY, ancho);
  campo(doc, 'Empresa', empresa, MARGEN + 268, campoY, ancho);
  campoY += alturaPrimera;
  campo(doc, 'WhatsApp', telefono, MARGEN + 14, campoY, ancho);
  campo(doc, 'Correo', correo, MARGEN + 268, campoY, ancho);
  campoY += alturaSegunda;
  campo(doc, 'Municipio y dirección de entrega', destino, MARGEN + 14, campoY, 475);

  let y = cajaY + altoBloque + 24;
  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLOR.tinta)
    .text('EQUIPOS COTIZADOS', MARGEN, y, { width: 511 });
  y = encabezadoTabla(doc, y + 22);

  for (const linea of cotizacion.lineas) {
    doc.font('Helvetica-Bold').fontSize(9);
    const altoNombre = doc.heightOfString(texto(linea.equipo), { width: 158, lineGap: 2 });
    const altoFila = Math.max(52, altoNombre + 20);
    if (y + altoFila > LIMITE) y = encabezadoTabla(doc, nuevaPagina(doc, folio));
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR.tinta)
      .text(texto(linea.equipo), 52, y + 10, { width: 158, lineGap: 2 });
    doc.font('Helvetica').fontSize(9).fillColor(COLOR.secundario)
      .text(`${fecha(linea.fechaInicio)}\nal ${fecha(linea.fechaFin)}`, 214, y + 10, { width: 93 });
    doc.fillColor(COLOR.tinta);
    const valores = [
      [linea.cantidad, 307, 35], [linea.dias, 347, 29],
      [dinero(linea.tarifaDia), 379, 74], [dinero(linea.importe), 456, 87],
    ];
    for (const [valor, x, anchoValor] of valores) {
      doc.text(texto(valor), x, y + 13, { width: anchoValor, align: 'right' });
    }
    doc.moveTo(MARGEN, y + altoFila).lineTo(553, y + altoFila).strokeColor(COLOR.borde).stroke();
    y += altoFila;
  }

  if (cotizacion.notas) {
    doc.font('Helvetica').fontSize(10);
    const altoNotas = doc.heightOfString(texto(cotizacion.notas), { width: 479, lineGap: 3 }) + 46;
    y = asegurarEspacio(doc, y + 18, altoNotas, folio);
    doc.roundedRect(MARGEN, y, 511, altoNotas, 8).fill(COLOR.fondo);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR.secundario)
      .text('NOTAS DE ENTREGA', MARGEN + 16, y + 12, { width: 479 });
    doc.font('Helvetica').fontSize(10).fillColor(COLOR.tinta)
      .text(texto(cotizacion.notas), MARGEN + 16, y + 29, { width: 479, lineGap: 3 });
    y += altoNotas;
  }

  y = asegurarEspacio(doc, y + 22, 128, folio);
  const xTotales = 328;
  const desglose = [
    ['Subtotal de renta', cotizacion.subtotal],
    ['Envío', cotizacion.envio ?? 0],
    ['IVA 16 %', cotizacion.iva],
  ];
  doc.font('Helvetica').fontSize(10);
  for (const [nombreFila, valor] of desglose) {
    doc.fillColor(COLOR.secundario).text(nombreFila, xTotales, y, { width: 130 });
    doc.fillColor(COLOR.tinta).text(dinero(valor), 460, y, { width: 86, align: 'right' });
    y += 24;
  }
  doc.roundedRect(xTotales - 10, y + 2, 228, 42, 7).fill(COLOR.naranjaSuave);
  doc.font('Helvetica-Bold').fontSize(12).fillColor(COLOR.tinta)
    .text('TOTAL', xTotales, y + 15, { width: 70 });
  doc.fillColor(COLOR.naranja)
    .text(dinero(cotizacion.total), xTotales + 81, y + 15, { width: 137, align: 'right' });

  const rango = doc.bufferedPageRange();
  for (let indice = 0; indice < rango.count; indice += 1) {
    doc.switchToPage(rango.start + indice);
    doc.moveTo(MARGEN, 780).lineTo(553, 780).strokeColor(COLOR.borde).stroke();
    doc.font('Helvetica').fontSize(8).fillColor(COLOR.tenue)
      .text('Renta de Maquinaria · Cd. Obregón, Sonora', MARGEN, 785, { width: 420 });
    doc.text(`${indice + 1} / ${rango.count}`, 490, 785, { width: 63, align: 'right' });
  }
}

export async function generarPdfCotizacion(cotizacion) {
  const logoPng = await icono();
  return new Promise((resolver, rechazar) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGEN, bufferPages: true, info: {
      Title: `Cotización ${cotizacion.folio}`, Author: 'Renta de Maquinaria',
      Subject: 'Cotización formal de renta de equipos',
    } });
    const partes = [];
    doc.on('data', (parte) => partes.push(parte));
    doc.on('end', () => resolver(Buffer.concat(partes)));
    doc.on('error', rechazar);
    try {
      dibujar(doc, cotizacion, logoPng);
      doc.end();
    } catch (error) {
      rechazar(error);
    }
  });
}
