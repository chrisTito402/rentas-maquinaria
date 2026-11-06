// Dueño: Héctor · HU-01a Ver catálogo de equipos (KAN-6) y HU-04 Ver detalle del equipo (KAN-8)
import { Router } from 'express';
import { query } from '../db.js';
import { errorHttp } from '../errores.js';

const r = Router();

// HU-01a · GET /api/equipos -> [{ id, nombre, tipo, modelo, tarifaDia, foto }]
r.get('/', async (req, res) => {
  const { rows } = await query(
    'SELECT id, nombre, tipo, modelo, tarifa_dia AS "tarifaDia", foto FROM equipos ORDER BY id',
  );
  res.json(rows);
});

// HU-04 · GET /api/equipos/:id -> { id, nombre, tipo, modelo, caracteristicas, tarifaDia, foto } · 404
r.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw errorHttp(404, 'Equipo no encontrado');
  const { rows } = await query(
    'SELECT id, nombre, tipo, modelo, caracteristicas, tarifa_dia AS "tarifaDia", foto FROM equipos WHERE id = $1',
    [id],
  );
  if (rows.length === 0) throw errorHttp(404, 'Equipo no encontrado');
  res.json(rows[0]);
});

export default r;
