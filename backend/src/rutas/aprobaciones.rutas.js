// Dueño: Héctor · HU-15a Aprobar cotización (KAN-15)
// HU-02a (Chris): al aprobar, los equipos quedan apartados; no se aprueba si sus fechas chocan.
import { Router } from 'express';
import { pool } from '../db.js';
import { errorHttp } from '../errores.js';
import { buscarChoque, mensajeChoque } from '../../../compartido/ocupadas.js';
import { rangosOcupados } from './ocupadas.rutas.js';
import { soloAdmin } from '../auth/roles.js';

const r = Router();

// PATCH /api/cotizaciones/:id/aprobar
// regresa 200: { id, folio, estado: 'Aprobada' }   ·   404 si no existe
// 403 si quien aprueba no es administrador (roles)
// 409 si no está Pendiente o si algún equipo ya está apartado en esas fechas (HU-02a)
r.patch('/:id/aprobar', soloAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) throw errorHttp(404, 'Cotización no encontrada');
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    // Un solo aprobado a la vez: así dos cotizaciones no apartan las mismas fechas al mismo tiempo.
    await db.query("SELECT pg_advisory_xact_lock(hashtext('rentas-maquinaria.apartados'))");
    const { rows: [cotizacion] } = await db.query('SELECT estado FROM cotizaciones WHERE id = $1', [id]);
    if (!cotizacion) throw errorHttp(404, 'Cotización no encontrada');
    if (cotizacion.estado !== 'Pendiente') throw errorHttp(409, 'Solo se aprueban cotizaciones Pendientes');

    const { rows: lineas } = await db.query(
      'SELECT equipo_id AS "equipoId", fecha_inicio AS "fechaInicio", fecha_fin AS "fechaFin" FROM cotizacion_equipos WHERE cotizacion_id = $1',
      [id],
    );
    for (const linea of lineas) {
      const choque = buscarChoque(linea, await rangosOcupados(db, linea.equipoId, id));
      if (choque) throw errorHttp(409, `No se puede aprobar: ${mensajeChoque(choque).toLowerCase()} (${choque.folio})`);
    }

    const { rows: [aprobada] } = await db.query(
      "UPDATE cotizaciones SET estado = 'Aprobada' WHERE id = $1 RETURNING id, folio, estado",
      [id],
    );
    await db.query('COMMIT');
    res.json(aprobada);
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    db.release();
  }
});

export default r;
