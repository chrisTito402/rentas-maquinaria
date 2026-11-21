// Dueña: Katia · A1 Vigencia de la cotización (ajuste de la re-presentación del Sprint 1)
import { pool } from './db.js';
import { DIAS_VIGENCIA } from '../../compartido/vigencia.js';

// Pasa a «Vencida» las cotizaciones Pendientes o Aprobadas con más de 15 días naturales.
// No vence una Aprobada a la que Operación ya le asignó unidades (ya la están preparando)
// ni una Aceptada por el cliente. Al dejar de estar Aprobada, sus fechas quedan libres.
// Regresa los folios que vencieron.
export async function vencerCotizaciones(db = pool) {
  const { rows } = await db.query(
    `UPDATE cotizaciones c SET estado = 'Vencida'
      WHERE c.estado IN ('Pendiente', 'Aprobada')
        AND c.creada_en + make_interval(days => $1::int) <= NOW()
        AND NOT EXISTS (SELECT 1 FROM operacion_rentas r WHERE r.datos ->> 'cotizacionId' = c.id::text)
      RETURNING c.folio`,
    [DIAS_VIGENCIA],
  );
  return rows.map((fila) => fila.folio);
}

// Revisa al arrancar el servidor y luego cada hora.
export function iniciarVigencia() {
  const revisar = () => vencerCotizaciones()
    .then((folios) => { if (folios.length) console.log(`Cotizaciones vencidas: ${folios.join(', ')}`); })
    .catch((error) => console.warn('No se pudo revisar la vigencia de las cotizaciones:', error.message));
  void revisar();
  setInterval(revisar, 60 * 60 * 1000).unref();
}
