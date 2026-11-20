import { useState } from 'react';
import { Link } from 'react-router-dom';

const fecha = value => new Date(value + 'T12:00:00').toLocaleDateString('es-MX');

export default function ReservacionesComerciales({ reservaciones, onAssign, foco }) {
  const [enCurso, setEnCurso] = useState(null);
  const [error, setError] = useState(null);

  async function asignar(event, cotizacion) {
    event.preventDefault();
    if (enCurso !== null) return;
    setEnCurso(cotizacion.id);
    setError(null);
    try {
      await onAssign(cotizacion.id);
    } catch (fallo) {
      setError({ id: cotizacion.id, mensaje: fallo.message });
    } finally {
      setEnCurso(null);
    }
  }

  return (
    <section aria-label="Cotizaciones por asignar">
      {!reservaciones.length && <div className="panel empty"><h2>No hay cotizaciones por asignar en esta vista</h2><p>Las solicitudes aparecerán aquí después de aprobarlas en Cotizaciones.</p><Link to="/comercial/cotizaciones">Ir a Cotizaciones →</Link></div>}
      {reservaciones.map(cotizacion => (
        <details key={cotizacion.id} className="assignment-card" open={String(cotizacion.id) === foco ? true : undefined}>
          <summary><strong>{cotizacion.folio} · {cotizacion.cliente.nombre}</strong> · Pendiente de asignación</summary>
          <p>{cotizacion.cliente.telefono} · {cotizacion.cliente.direccion}</p>
          <Link to={'/comercial/cotizaciones/' + cotizacion.id}>Revisar cotización completa</Link>
          {onAssign ? <form onSubmit={event => asignar(event, cotizacion)}>
            {cotizacion.lineas.map(linea => <p key={linea.id}>{linea.cantidad} × {linea.equipo} · {fecha(linea.inicio)} al {fecha(linea.fin)}</p>)}
            {error?.id === cotizacion.id && <p className="alert" role="alert">{error.mensaje}</p>}
            <button className="button dark" type="submit" disabled={enCurso !== null || !cotizacion.lineas.length}>
              {enCurso === cotizacion.id ? 'Guardando…' : 'Asignar máquinas disponibles'}
            </button>
          </form> : <p>Solo consulta</p>}
        </details>
      ))}
    </section>
  );
}
