// Dueño: Chris · HU-02a Fechas ocupadas (KAN-9)
import { Router } from 'express';
import { query } from '../db.js';
import { errorHttp } from '../errores.js';
import { ESTADOS_QUE_APARTAN } from '../../../compartido/constantes.js';

const r = Router();

// Rangos en que un equipo ya está apartado: líneas de cotizaciones Aprobadas o Aceptadas
// que todavía no terminan. La usan esta ruta, crearCotizacion y aprobar.
// db: { query } o el cliente de una transacción · sinCotizacion: id que no se cuenta (la que se aprueba)
// regresa: [{ inicio: '2026-11-25', fin: '2026-11-27', folio: 'COT-0002' }]
export async function rangosOcupados(db, equipoId, sinCotizacion = 0) {
  const { rows } = await db.query(
    `SELECT ce.fecha_inicio AS inicio, ce.fecha_fin AS fin, c.folio
       FROM cotizacion_equipos ce
       JOIN cotizaciones c ON c.id = ce.cotizacion_id
      WHERE ce.equipo_id = $1
        AND c.estado = ANY($2::text[])
        AND c.id <> $3
        AND ce.fecha_fin >= CURRENT_DATE
      ORDER BY ce.fecha_inicio`,
    [equipoId, ESTADOS_QUE_APARTAN, sinCotizacion],
  );
  return rows;
}

// GET /api/equipos/:id/ocupadas  (pública: el cliente ve el calendario)
// regresa 200: [{ inicio, fin }]  (sin el folio, que es dato interno)  ·  404 si el id no es válido
r.get('/:id/ocupadas', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) throw errorHttp(404, 'Equipo no encontrado');
  const rangos = await rangosOcupados({ query }, id);
  res.json(rangos.map(({ inicio, fin }) => ({ inicio, fin })));
});

export default r;
