// Dueño: Katia · HU-10 Consultar cotizaciones (KAN-19)
import { Router } from 'express';
import { query } from '../db.js';
import { errorHttp } from '../errores.js';
import { ESTADOS, ORIGENES } from '../../../compartido/constantes.js';
import { vencerCotizaciones } from '../vigencia.js';

const r = Router();

// GET /api/cotizaciones?q=texto&estado=Aprobada&origen=Panel
// busca por folio o por cliente y filtra por estado y origen (HU-16); la más reciente primero
r.get('/', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const estado = String(req.query.estado ?? '');
  const origen = String(req.query.origen ?? '');
  if (estado && !ESTADOS.includes(estado)) throw errorHttp(400, 'Estado no válido');
  if (origen && !ORIGENES.includes(origen)) throw errorHttp(400, 'Origen no válido');
  await vencerCotizaciones();   // A1: así la lista nunca muestra como vigente una que ya venció
  const { rows } = await query(
    `SELECT c.id, c.folio, cl.nombre AS cliente, cl.empresa, c.origen, c.estado, c.total,
            c.creada_en AS "creadaEn",
            MIN(ce.fecha_inicio) AS "fechaInicio", MAX(ce.fecha_fin) AS "fechaFin",
            (ARRAY_AGG(e.nombre ORDER BY ce.id))[1] AS "primerEquipo",
            COUNT(ce.id)::int AS "numEquipos"
       FROM cotizaciones c
       JOIN clientes cl ON cl.id = c.cliente_id
       LEFT JOIN cotizacion_equipos ce ON ce.cotizacion_id = c.id
       LEFT JOIN equipos e ON e.id = ce.equipo_id
      WHERE ($1::text = '' OR c.folio ILIKE '%' || $1::text || '%' OR cl.nombre ILIKE '%' || $1::text || '%'
             OR cl.empresa ILIKE '%' || $1::text || '%')
        AND ($2::text = '' OR c.estado = $2::text)
        AND ($3::text = '' OR c.origen = $3::text)
      GROUP BY c.id, cl.nombre, cl.empresa
      ORDER BY c.creada_en DESC, c.id DESC`,
    [q, estado, origen],
  );
  res.json(rows);
});

// GET /api/cotizaciones/:id  (detalle con cliente, equipos y costos)
r.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw errorHttp(400, 'Id de cotización inválido');
  await vencerCotizaciones();
  const { rows } = await query(
    `SELECT c.id, c.folio, c.origen, c.estado, c.notas, c.subtotal, c.envio, c.iva, c.total, c.creada_en AS "creadaEn",
            json_build_object('nombre', cl.nombre, 'telefono', cl.telefono, 'correo', cl.correo,
                              'empresa', cl.empresa, 'municipio', cl.municipio, 'direccion', cl.direccion,
                              'codigoPostal', cl.codigo_postal, 'colonia', cl.colonia) AS cliente
       FROM cotizaciones c
       JOIN clientes cl ON cl.id = c.cliente_id
      WHERE c.id = $1`,
    [id],
  );
  if (!rows.length) throw errorHttp(404, 'Cotización no encontrada');
  const { rows: lineas } = await query(
    `SELECT ce.id, e.nombre AS equipo, ce.cantidad, ce.fecha_inicio AS "fechaInicio", ce.fecha_fin AS "fechaFin",
            ce.dias, ce.tarifa_dia AS "tarifaDia", ce.importe
       FROM cotizacion_equipos ce
       JOIN equipos e ON e.id = ce.equipo_id
      WHERE ce.cotizacion_id = $1
      ORDER BY ce.id`,
    [id],
  );
  res.json({ ...rows[0], lineas });
});

export default r;
