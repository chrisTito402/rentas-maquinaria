import { pool } from './db.js';
import { errorHttp } from './errores.js';
import { applyOperation } from '../../compartido/operacion/operaciones.js';
import { cotizacionesAprobadas, asignarUnidades, normalizarUnidad } from './reservaciones.js';
import { listarEquipos, nuevaUnidad } from './catalogo.js';
import { coincideModelo } from '../../compartido/operacion/catalogo.js';

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

async function leerPanel(db) {
  const data = await leer(db);
  const apartadas = new Set(data.rentals.map(renta => renta.cotizacionId));
  const reservaciones = (await cotizacionesAprobadas(db)).filter(cotizacion => !apartadas.has(cotizacion.id));
  const catalogo = await leerCatalogo(db);
  return { ...data, reservaciones, catalogo };
}

async function leerCatalogo(db) {
  const { rows: [schema] } = await db.query("SELECT to_regclass('equipos') IS NOT NULL AS existe");
  return schema.existe ? listarEquipos(db) : [];
}

export function cargarOperacion() {
  return leerPanel(pool);
}

export function registrarOperacion(id, accion, campos) {
  return transaccion(async db => {
    const actual = await leer(db);
    let data;
    try {
      data = applyOperation(actual, id, accion, campos);
    } catch (error) {
      throw errorHttp(409, error.message);
    }
    await guardar(db, data);
    return leerPanel(db);
  });
}

export function crearApartado(cotizacionId, unidades) {
  return transaccion(async db => {
    const actual = await leer(db);
    if (actual.rentals.some(renta => renta.cotizacionId === cotizacionId)) return leerPanel(db);
    const [cotizacion] = await cotizacionesAprobadas(db, cotizacionId);
    if (!cotizacion) throw errorHttp(404, 'No se encontró una cotización aprobada con ese folio.');
    await guardar(db, asignarUnidades(actual, cotizacion, unidades));
    return leerPanel(db);
  });
}

export function registrarUnidad(equipoId, identificador) {
  const id = normalizarUnidad(identificador);
  if (!id || id.length > 64) throw errorHttp(400, 'Indica un identificador físico válido.');
  return transaccion(async db => {
    const equipo = (await leerCatalogo(db)).find(item => item.id === equipoId);
    if (!equipo) throw errorHttp(404, 'No se encontró el modelo en el catálogo.');
    const { units } = await leer(db);
    const existente = units.find(unidad => normalizarUnidad(unidad.id) === id);
    if (existente && !coincideModelo(existente, equipo)) {
      throw errorHttp(409, `La unidad ${id} ya corresponde a otro modelo.`);
    }
    const unidad = existente ? { ...existente, catalogoId: equipo.id } : nuevaUnidad(equipo, id);
    await guardar(db, { units: [unidad], rentals: [] });
    return leerPanel(db);
  });
}
