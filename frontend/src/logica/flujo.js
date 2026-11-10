export const etapas = [
  { id: 'por-asignar', titulo: 'Por asignar', descripcion: 'Cotizaciones aprobadas. Elige las unidades físicas antes de preparar los equipos.' },
  { id: 'preparacion', titulo: 'Preparación', descripcion: 'Unidades asignadas que necesitan revisión del mecánico antes de salir.' },
  { id: 'listos', titulo: 'Listos para entregar', descripcion: 'Equipos preparados. Revisa los documentos y registra la entrega cuando ocurra.' },
  { id: 'rentas', titulo: 'En renta', descripcion: 'Equipos con el cliente. Registra la devolución cuando lleguen.' },
  { id: 'revision', titulo: 'Revisión final', descripcion: 'Equipos devueltos. Registra su estado final para cerrar cada renta.' },
  { id: 'mantenimiento', titulo: 'Preparación detenida', descripcion: 'Equipos enviados a mantenimiento antes de la entrega. Retoma su preparación después de la reparación.' },
];

export function etapaRenta(renta) {
  const id = renta.status === 'Cerrada' ? 'historial'
    : renta.status === 'En mantenimiento' ? 'mantenimiento'
      : renta.status === 'En renta' ? 'rentas'
        : renta.status === 'En revisión' ? 'revision'
          : renta.status === 'En preparación' && renta.ready ? 'listos' : 'preparacion';
  return etapas.find(e => e.id === id) ?? { id: 'historial', titulo: 'Cerrada' };
}

export function rentasEnEtapa(data, id) {
  return data.rentals.filter(r => etapaRenta(r).id === id);
}
