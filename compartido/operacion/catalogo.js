const normalizar = valor => String(valor ?? '').trim().toUpperCase();

export function coincideModelo(unidad, equipo) {
  if (unidad.catalogoId != null) return Number(unidad.catalogoId) === equipo.id;
  return normalizar(unidad.model) === normalizar(equipo.modelo)
    && normalizar(unidad.type) === normalizar(equipo.tipo);
}

export function resumirCatalogo(catalogo, unidades, reservaciones, rentas) {
  const modelos = new Map(catalogo.map(equipo => [
    equipo.id, { ...equipo, unidades: [], pendientes: 0, disponibles: 0 },
  ]));
  const activas = new Map(rentas.filter(renta => renta.status !== 'Cerrada')
    .map(renta => [renta.unit, renta.status]));
  const sinModelo = [];
  for (const registro of unidades) {
    const estadoActivo = activas.get(registro.id);
    const unidad = registro.state === 'Disponible' && estadoActivo
      ? { ...registro, state: estadoActivo }
      : registro;
    const coincidencias = catalogo.filter(equipo => coincideModelo(unidad, equipo));
    if (coincidencias.length === 1) modelos.get(coincidencias[0].id).unidades.push(unidad);
    else sinModelo.push(unidad);
  }
  for (const reservacion of reservaciones) {
    for (const linea of reservacion.lineas) {
      const modelo = modelos.get(linea.equipoId);
      if (modelo) modelo.pendientes += linea.cantidad;
    }
  }
  for (const modelo of modelos.values()) {
    const libres = modelo.unidades.filter(unidad => unidad.state === 'Disponible').length;
    modelo.disponibles = Math.max(0, libres - modelo.pendientes);
  }
  return { modelos: [...modelos.values()], sinModelo };
}
