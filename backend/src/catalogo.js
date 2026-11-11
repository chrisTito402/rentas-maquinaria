export async function listarEquipos(db) {
  const { rows } = await db.query(
    'SELECT id, nombre, tipo, modelo, caracteristicas, tarifa_dia AS "tarifaDia", foto FROM equipos ORDER BY id',
  );
  return rows;
}

export function nuevaUnidad(equipo, id) {
  return {
    id, catalogoId: equipo.id, modelId: String(equipo.id),
    name: equipo.nombre, model: equipo.modelo, type: equipo.tipo,
    brand: '', serial: '', hours: 0, state: 'Disponible',
  };
}
