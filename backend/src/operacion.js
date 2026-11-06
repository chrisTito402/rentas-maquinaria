import { pool } from './db.js';
import { errorHttp } from './errores.js';
import { applyOperation, initialData } from '../../compartido/operacion/operaciones.js';

async function transaccion(operacion) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    // Las escrituras se serializan para aplicar cada transición al estado vigente.
    await db.query("SELECT pg_advisory_xact_lock(hashtext('rentas-maquinaria.operacion'))");
    const resultado = await operacion(db);
    await db.query('COMMIT');
    return resultado;
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    db.release();
  }
}

async function leer(db) {
  const { rows: [data] } = await db.query(`
    SELECT
      COALESCE((SELECT jsonb_agg(datos ORDER BY id) FROM operacion_equipos), '[]') AS units,
      COALESCE((SELECT jsonb_agg(datos ORDER BY id) FROM operacion_rentas), '[]') AS rentals
  `);
  return data;
}

async function guardar(db, { units, rentals }) {
  await db.query(`
    INSERT INTO operacion_equipos (id, datos)
    SELECT item ->> 'id', item FROM jsonb_array_elements($1::jsonb) AS item
    ON CONFLICT (id) DO UPDATE SET datos = EXCLUDED.datos
    WHERE operacion_equipos.datos IS DISTINCT FROM EXCLUDED.datos
  `, [JSON.stringify(units)]);
  await db.query(`
    INSERT INTO operacion_rentas (id, equipo_id, datos)
    SELECT item ->> 'id', item ->> 'unit', item FROM jsonb_array_elements($1::jsonb) AS item
    ON CONFLICT (id) DO UPDATE SET equipo_id = EXCLUDED.equipo_id, datos = EXCLUDED.datos
    WHERE operacion_rentas.datos IS DISTINCT FROM EXCLUDED.datos
  `, [JSON.stringify(rentals)]);
}

async function leerConEjemplos(db) {
  const data = await leer(db);
  if (data.units.length) return data;
  await guardar(db, initialData());
  return leer(db);
}

export async function cargarOperacion() {
  const data = await leer(pool);
  return data.units.length ? data : transaccion(leerConEjemplos);
}

export function registrarOperacion(id, accion, campos) {
  return transaccion(async db => {
    const actual = await leerConEjemplos(db);
    let data;
    try {
      data = applyOperation(actual, id, accion, campos);
    } catch (error) {
      throw errorHttp(409, error.message);
    }
    await guardar(db, data);
    return data;
  });
}

export function reiniciarOperacion() {
  return transaccion(async db => {
    await db.query('DELETE FROM operacion_rentas; DELETE FROM operacion_equipos;');
    await guardar(db, initialData());
    return leer(db);
  });
}
