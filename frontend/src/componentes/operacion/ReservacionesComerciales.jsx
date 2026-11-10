import { useState } from 'react';
import { Link } from 'react-router-dom';

const fecha = value => new Date(value + 'T12:00:00').toLocaleDateString('es-MX');

export default function ReservacionesComerciales({ reservaciones, onAssign, units = [], foco }) {
  const [enCurso, setEnCurso] = useState(null);
  const [error, setError] = useState(null);

  async function asignar(event, cotizacion) {
    event.preventDefault();
    if (enCurso !== null) return;
    const unidades = new FormData(event.currentTarget).getAll('unidad');
    setEnCurso(cotizacion.id);
    setError(null);
    try {
      await onAssign(cotizacion.id, unidades);
    } catch (fallo) {
      setError({ id: cotizacion.id, mensaje: fallo.message });
    } finally {
      setEnCurso(null);
    }
  }

  return (
    <section aria-label="Cotizaciones por asignar">
      {!reservaciones.length && <div className="panel empty"><h2>No hay cotizaciones por asignar en esta vista</h2><p>Las solicitudes aparecerán aquí después de aprobarlas en Cotizaciones.</p><Link to="/gestion/cotizaciones">Ir a Cotizaciones →</Link></div>}
      {reservaciones.map(cotizacion => (
        <details key={cotizacion.id} className="assignment-card" open={String(cotizacion.id) === foco ? true : undefined}>
          <summary><strong>{cotizacion.folio} · {cotizacion.cliente.nombre}</strong> · Pendiente de asignación</summary>
          <p>{cotizacion.cliente.telefono} · {cotizacion.cliente.direccion}</p>
          <Link to={'/gestion/cotizaciones/' + cotizacion.id}>Revisar cotización completa</Link>
          <form onSubmit={event => asignar(event, cotizacion)}>
            <p>2. Elige una unidad física por equipo. Puedes seleccionar un identificador disponible o escribir uno nuevo para registrarlo. Guardar no inicia la preparación ni confirma la entrega.</p>
            <fieldset disabled={enCurso !== null} className="assignment-fields">
            <div className="form-grid">
              {cotizacion.lineas.flatMap(linea => Array.from({ length: linea.cantidad }, (_, indice) => (
                <label className="field" key={`${linea.id}-${indice}`}>
                  <span>{linea.equipo} · Unidad {indice + 1}</span>
                  <small>{fecha(linea.inicio)} al {fecha(linea.fin)}</small>
                  <input name="unidad" list={`unidades-${cotizacion.id}-${linea.id}`} maxLength={64} placeholder="Selecciona o escribe el identificador" required />
                  <datalist id={`unidades-${cotizacion.id}-${linea.id}`}>{units.filter(u => u.state === 'Disponible' && u.catalogoId === linea.equipoId).map(u => <option key={u.id} value={u.id} />)}</datalist>
                </label>
              )))}
            </div>
            </fieldset>
            {error?.id === cotizacion.id && <p className="alert" role="alert">{error.mensaje}</p>}
            <button className="button dark" type="submit" disabled={enCurso !== null || !cotizacion.lineas.length}>
              {enCurso === cotizacion.id ? 'Guardando…' : 'Guardar asignación'}
            </button>
          </form>
        </details>
      ))}
    </section>
  );
}
