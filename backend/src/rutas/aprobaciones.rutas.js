// Dueño: Héctor · HU-15a Aprobar cotización (KAN-15)
import { Router } from 'express';
import { query } from '../db.js';
import { errorHttp } from '../errores.js';

const r = Router();

// PATCH /api/cotizaciones/:id/aprobar
// regresa 200: { id, folio, estado: 'Aprobada' }   ·   404 si no existe   ·   409 si no está Pendiente
r.patch('/:id/aprobar', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw errorHttp(404, 'Cotización no encontrada');
  const { rows } = await query('SELECT id, folio, estado FROM cotizaciones WHERE id = $1', [id]);
  if (rows.length === 0) throw errorHttp(404, 'Cotización no encontrada');
  const cotizacion = rows[0];
  if (cotizacion.estado !== 'Pendiente') {
    throw errorHttp(409, 'Solo se aprueban cotizaciones Pendientes');
  }
  const { rows: aprobada } = await query(
    "UPDATE cotizaciones SET estado = 'Aprobada' WHERE id = $1 RETURNING id, folio, estado",
    [id],
  );
  res.json(aprobada[0]);
});

export default r;
