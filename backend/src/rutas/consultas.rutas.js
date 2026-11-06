// Dueño: Katia · HU-10 Consultar cotizaciones (KAN-19)
import { Router } from 'express';
import { query } from '../db.js';
import { errorHttp } from '../errores.js';

const r = Router();

// GET /api/cotizaciones?q=texto  (busca por folio o por cliente; la más reciente primero)
r.get('/', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const { rows } = await query(
    `SELECT c.id, c.folio, cl.nombre AS cliente, c.origen, c.estado, c.total,
            c.creada_en AS "creadaEn",
            MIN(ce.fecha_inicio) AS "fechaInicio", MAX(ce.fecha_fin) AS "fechaFin"
       FROM cotizaciones c
       JOIN clientes cl ON cl.id = c.cliente_id
       LEFT JOIN cotizacion_equipos ce ON ce.cotizacion_id = c.id
      WHERE $1::text = '' OR c.folio ILIKE '%' || $1::text || '%' OR cl.nombre ILIKE '%' || $1::text || '%'
      GROUP BY c.id, cl.nombre
      ORDER BY c.creada_en DESC, c.id DESC`,
    [q],
  );
  res.json(rows);
});

// GET /api/cotizaciones/:id  (detalle con cliente, equipos y costos)
r.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw errorHttp(400, 'Id de cotización inválido');
  const { rows } = await query(
    `SELECT c.id, c.folio, c.origen, c.estado, c.notas, c.subtotal, c.iva, c.total, c.creada_en AS "creadaEn",
            json_build_object('nombre', cl.nombre, 'telefono', cl.telefono, 'correo', cl.correo,
                              'empresa', cl.empresa, 'municipio', cl.municipio, 'direccion', cl.direccion) AS cliente
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
