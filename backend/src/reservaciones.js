import { autorSinCuenta } from '../../compartido/operacion/registros.js';
import { rentaVigente, chocaPreventivo } from '../../compartido/operacion/taller.js';
import { errorHttp } from './errores.js';
import { nuevaUnidad } from './catalogo.js';
import { coincideModelo } from '../../compartido/operacion/catalogo.js';

export async function cotizacionesAprobadas(db, id = null) {
  const { rows: [schema] } = await db.query("SELECT to_regclass('cotizaciones') IS NOT NULL AS comercial");
  if (!schema.comercial) return [];

  const { rows } = await db.query(`
    SELECT c.id, COALESCE(c.folio, 'COT-' || c.id) AS folio,
           jsonb_build_object('nombre', cl.nombre, 'telefono', trim(cl.telefono),
                              'correo', cl.correo, 'direccion', cl.direccion,
                              'municipio', cl.municipio) AS cliente,
           COALESCE(jsonb_agg(jsonb_build_object('id', ce.id, 'equipoId', e.id,
                    'equipo', e.nombre, 'modelo', e.modelo, 'tipo', e.tipo,
                    'cantidad', ce.cantidad, 'inicio', ce.fecha_inicio, 'fin', ce.fecha_fin)
                    ORDER BY ce.id) FILTER (WHERE ce.id IS NOT NULL), '[]') AS lineas
      FROM cotizaciones c
      JOIN clientes cl ON cl.id = c.cliente_id
      LEFT JOIN cotizacion_equipos ce ON ce.cotizacion_id = c.id
      LEFT JOIN equipos e ON e.id = ce.equipo_id
     WHERE c.estado = 'Aprobada' AND ($1::int IS NULL OR c.id = $1)
     GROUP BY c.id, cl.id
     ORDER BY c.id DESC
  `, [id]);
  return rows;
}

export const normalizarUnidad = valor => String(valor ?? '').trim().toUpperCase();

function seleccionarDisponibles(lineas, unidades, disponible) {
  const asignadas = new Map();
  const opciones = lineas.map(linea => unidades.filter(unidad => disponible(unidad, linea)));
  // Una unidad con varias fechas posibles puede ceder su lugar a otra.
  function encontrar(indice, visitadas) {
    for (const unidad of opciones[indice]) {
      if (visitadas.has(unidad.id)) continue;
      visitadas.add(unidad.id);
      if (!asignadas.has(unidad.id) || encontrar(asignadas.get(unidad.id), visitadas)) {
        asignadas.set(unidad.id, indice);
        return true;
      }
    }
    return false;
  }
  for (const [indice, linea] of lineas.entries()) {
    if (!encontrar(indice, new Set())) {
      throw errorHttp(409, 'No hay suficientes unidades de ' + linea.equipo + ' disponibles para estas fechas.');
    }
  }
  const ids = [];
  for (const [id, indice] of asignadas) ids[indice] = id;
  return ids;
}

export function asignarUnidades(data, cotizacion, identificadores, autor = autorSinCuenta) {
  const lineas = cotizacion.lineas.flatMap(linea => Array(linea.cantidad).fill(linea));
  const ocupadas = new Set(data.rentals.filter(rentaVigente).map(renta => normalizarUnidad(renta.unit)));
  const disponible = (unidad, linea) => unidad.state === 'Disponible'
    && !ocupadas.has(normalizarUnidad(unidad.id))
    && coincideModelo(unidad, { id: linea.equipoId, modelo: linea.modelo, tipo: linea.tipo })
    && !chocaPreventivo(unidad, linea.inicio, linea.fin);
  const seleccion = identificadores ?? seleccionarDisponibles(lineas, data.units, disponible);
  if (!lineas.length || seleccion.length !== lineas.length) {
    throw errorHttp(400, 'Indica una unidad física por cada equipo cotizado.');
  }
  const ids = seleccion.map(normalizarUnidad);
  if (ids.some(id => !id || id.length > 64) || new Set(ids).size !== ids.length) {
    throw errorHttp(400, 'Los identificadores de las unidades deben ser válidos y distintos.');
  }

  const units = new Map(data.units.map(unidad => [normalizarUnidad(unidad.id), unidad]));
  const at = new Date().toISOString();
  let numero = data.rentals.reduce((maximo, renta) =>
    Math.max(maximo, Number(renta.id.match(/^R-(\d+)$/)?.[1] ?? 0)), 0);
  const cliente = cotizacion.cliente;
  const nuevas = lineas.map((linea, indice) => {
    const id = ids[indice];
    const existente = units.get(id);
    const equipo = { id: linea.equipoId, nombre: linea.equipo, modelo: linea.modelo, tipo: linea.tipo };
    if (existente && !disponible(existente, linea)) {
      throw errorHttp(409, `La unidad ${id} debe estar disponible y corresponder a ${linea.equipo}.`);
    }
    const unidad = existente ?? nuevaUnidad(equipo, id);
    units.set(id, { ...unidad, catalogoId: linea.equipoId, state: 'Apartado', stateChangedAt: at });
    return {
      id: `R-${String(++numero).padStart(3, '0')}`,
      cotizacionId: cotizacion.id, commercial: cotizacion.folio, unit: unidad.id,
      client: cliente.nombre, contact: cliente.nombre, phone: cliente.telefono,
      email: cliente.correo, address: cliente.direccion, site: cliente.municipio,
      start: linea.inicio, end: linea.fin, status: 'Apartado', ready: false,
      issues: [], reviews: [],
      events: [{ at, text: `Apartado recibido de Comercial (${cotizacion.folio})`, ...autor }],
    };
  });
  return { units: [...units.values()], rentals: [...data.rentals, ...nuevas] };
}
