// Dueño: Héctor · HU-07 Generar y enviar cotización en PDF (KAN-16)
import { Router } from 'express';
import { query } from '../db.js';
import { errorHttp } from '../errores.js';
import { generarPdfCotizacion } from '../pdf-cotizacion.js';

const r = Router();

// Ya está detrás de protegerSesion() en app.js; nunca devuelve un PDF de una Pendiente.
r.get('/:id/pdf', async (req, res) => {
  if (!['admin', 'auxiliar'].includes(req.usuario?.rol)) {
    throw errorHttp(403, 'Solo el personal comercial puede descargar cotizaciones.');
  }
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) throw errorHttp(400, 'Id de cotización inválido');
  const { rows: [cotizacion] } = await query(
    `SELECT c.folio, c.estado, c.origen, c.notas, c.subtotal, c.envio, c.iva, c.total,
            c.creada_en AS "creadaEn",
            json_build_object('nombre', cl.nombre, 'telefono', cl.telefono, 'correo', cl.correo,
                              'empresa', cl.empresa, 'municipio', cl.municipio, 'direccion', cl.direccion) AS cliente
       FROM cotizaciones c
       JOIN clientes cl ON cl.id = c.cliente_id
      WHERE c.id = $1`,
    [id],
  );
  if (!cotizacion) throw errorHttp(404, 'Cotización no encontrada');
  if (cotizacion.estado !== 'Aprobada') throw errorHttp(409, 'Solo se genera el PDF de cotizaciones Aprobadas.');
  const { rows: lineas } = await query(
    `SELECT e.nombre AS equipo, ce.cantidad, ce.fecha_inicio AS "fechaInicio",
            ce.fecha_fin AS "fechaFin", ce.dias, ce.tarifa_dia AS "tarifaDia", ce.importe
       FROM cotizacion_equipos ce
       JOIN equipos e ON e.id = ce.equipo_id
      WHERE ce.cotizacion_id = $1
      ORDER BY ce.id`,
    [id],
  );
  const pdf = await generarPdfCotizacion({ ...cotizacion, lineas });
  const archivo = `${String(cotizacion.folio).replace(/[^A-Za-z0-9-]/g, '')}.pdf`;
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${archivo}"`,
    'Content-Length': pdf.length,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.send(pdf);
});

export default r;
