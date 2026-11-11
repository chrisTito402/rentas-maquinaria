import { useState } from 'react';
import { resumirCatalogo } from '@compartido/operacion/catalogo.js';

const tonos = {
  Disponible: 'green', Apartado: 'blue', 'En preparación': 'amber', 'En renta': 'green',
  'En revisión': 'amber', 'En mantenimiento': 'red', 'Fuera de servicio': 'red',
};

function Unidad({ unidad, pendiente = false }) {
  const estado = pendiente && unidad.state === 'Disponible' ? 'Sin asignar' : unidad.state;
  return (
    <div className="catalog-meta">
      <span className="catalog-code">{unidad.id}</span>
      <span className={'badge ' + (tonos[estado] ?? 'muted')}><i />{estado}</span>
    </div>
  );
}

function RegistroUnidad({ equipo, onRegister }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function registrar(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (guardando) return;
    setGuardando(true);
    setError('');
    try {
      await onRegister(equipo.id, new FormData(form).get('unidad'));
      form.reset();
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <details className="additional-details">
      <summary>Registrar unidad física</summary>
      <form className="additional-body" onSubmit={registrar}>
        <label className="field">
          <span>Identificador físico</span>
          <input name="unidad" required maxLength={64} />
        </label>
        {error && <p className="alert" role="alert">{error}</p>}
        <button type="submit" className="button soft compact" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar unidad'}
        </button>
      </form>
    </details>
  );
}

export default function EquipmentCatalog({ units, catalogo, reservaciones, rentals, onRegister }) {
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const { modelos, sinModelo } = resumirCatalogo(catalogo, units, reservaciones, rentals);
  const visibles = soloDisponibles ? modelos.filter(equipo => equipo.disponibles > 0) : modelos;

  return (
    <>
      <header className="page-heading">
        <div><p className="eyebrow">MODELOS Y UNIDADES FÍSICAS</p><h1>Inventario</h1>
          <p>Consulta la disponibilidad y registra unidades. Para asignarlas a una cotización, entra a Operación → Por asignar.</p>
        </div>
      </header>
      <div className="tabs">
        <button className={soloDisponibles ? '' : 'selected'} aria-pressed={!soloDisponibles}
          onClick={() => setSoloDisponibles(false)}>Todos</button>
        <button className={soloDisponibles ? 'selected' : ''} aria-pressed={soloDisponibles}
          onClick={() => setSoloDisponibles(true)}>Disponibles</button>
      </div>
      <div className="catalog-grid">
        {visibles.map(equipo => (
          <article className="panel catalog-card" key={equipo.id}>
            <div className="catalog-photo">
              {equipo.foto ? <img src={equipo.foto} alt={equipo.nombre} /> : <span>{equipo.tipo}</span>}
            </div>
            <div className="catalog-card-body">
              <div className="catalog-meta">
                <span className="catalog-code">{equipo.tipo}</span>
                <span className={'badge ' + (equipo.disponibles ? 'green' : 'muted')}>
                  <i />{equipo.disponibles} disponibles
                </span>
              </div>
              <h2>{equipo.nombre}</h2>
              <p className="catalog-model">{equipo.modelo}</p>
              {!soloDisponibles && (
                <>
                  {equipo.pendientes > 0 && <p>{equipo.pendientes} solicitadas en reservaciones por asignar.</p>}
                  {equipo.unidades.length ? equipo.unidades.map(unidad => (
                    <Unidad key={unidad.id} unidad={unidad} pendiente={equipo.pendientes > 0} />
                  )) : <p>Sin unidades físicas registradas.</p>}
                  <RegistroUnidad equipo={equipo} onRegister={onRegister} />
                </>
              )}
            </div>
          </article>
        ))}
      </div>
      {!visibles.length && (
        <section className="panel empty">
          <h3>{soloDisponibles ? 'No hay equipos disponibles' : 'El catálogo está vacío'}</h3>
        </section>
      )}
      {!soloDisponibles && sinModelo.length > 0 && (
        <section className="panel">
          <div className="panel-heading"><h2>Unidades sin modelo vinculado</h2></div>
          {sinModelo.map(unidad => <Unidad key={unidad.id} unidad={unidad} />)}
        </section>
      )}
    </>
  );
}
