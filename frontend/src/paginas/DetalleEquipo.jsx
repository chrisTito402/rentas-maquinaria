// Dueño: Héctor · HU-04 Ver detalle del equipo (KAN-8)
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useCarrito } from '../carrito/CarritoContext.jsx';
import DesgloseCostos from '../componentes/DesgloseCostos.jsx';
import { MAX_CANTIDAD } from '@compartido/constantes.js';
import { contarDias } from '@compartido/costos.js';
import { dinero } from '@compartido/formato.js';

export default function DetalleEquipo() {
  const { id } = useParams();
  const { agregar } = useCarrito();
  const [equipo, setEquipo] = useState(null);
  const [error, setError] = useState('');
  const [cantidadTexto, setCantidadTexto] = useState('1');   // lo que se ve en el campo
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    api.get(`/equipos/${id}`)
      .then((datos) => setEquipo(datos))
      .catch((fallo) => setError(
        fallo.status === 404 ? 'Equipo no encontrado.' : (fallo.message || 'No se pudo cargar el equipo.'),
      ));
  }, [id]);

  // El campo puede quedar vacío mientras se escribe (para cambiar el 1 por otro número);
  // la cantidad que se usa siempre queda entre 1 y MAX_CANTIDAD.
  const cantidad = Math.min(MAX_CANTIDAD, Math.max(1, parseInt(cantidadTexto, 10) || 1));
  const cambiarCantidad = (valor) => {
    setCantidadTexto(valor.replace(/\D/g, '').slice(0, 2));
    setMensaje('');
  };
  const cambiarFecha = (poner, valor) => { poner(valor); setMensaje(''); };

  if (error) return (
    <>
      <h1>Equipo no disponible</h1>
      <p className="error">{error}</p>
      <Link className="boton" to="/">Volver al catálogo</Link>
    </>
  );
  if (!equipo) return <p>Cargando…</p>;

  const dias = contarDias(fechaInicio, fechaFin);
  const fechasValidas = dias > 0;
  const fechasInvertidas = fechaInicio !== '' && fechaFin !== '' && dias === 0;

  function agregarEquipo() {
    agregar({
      equipoId: equipo.id, nombre: equipo.nombre, foto: equipo.foto, tarifaDia: equipo.tarifaDia,
      cantidad, fechaInicio, fechaFin,
    });
    setMensaje(`${cantidad} × ${equipo.nombre}: se agregó a tu cotización.`);
  }

  return (
    <>
      <h1>{equipo.nombre}</h1>
      <div className="dos-columnas">
        <div>
          <img className="ficha-foto" src={equipo.foto} alt={equipo.nombre} />
          <h2>Características</h2>
          <p>{equipo.caracteristicas}</p>
          <p className="tenue">Tipo: {equipo.tipo} · Modelo: {equipo.modelo}</p>
        </div>
        <div>
          <section className="panel" aria-label="Agregar a mi cotización">
            <h2>Agregar a mi cotización</h2>
            <p className="precio">{dinero(equipo.tarifaDia)} <small>/ día</small></p>
            <label htmlFor="cantidad">Cantidad (1 a {MAX_CANTIDAD})</label>
            <input id="cantidad" type="number" min="1" max={MAX_CANTIDAD} value={cantidadTexto}
              onChange={(e) => cambiarCantidad(e.target.value)}
              onBlur={() => setCantidadTexto(String(cantidad))} />
            <label htmlFor="inicio">Fecha de inicio</label>
            <input id="inicio" type="date" value={fechaInicio}
              onChange={(e) => cambiarFecha(setFechaInicio, e.target.value)} />
            <label htmlFor="fin">Fecha de fin</label>
            <input id="fin" type="date" value={fechaFin}
              onChange={(e) => cambiarFecha(setFechaFin, e.target.value)} />
            {fechasInvertidas && (
              <p className="error">La fecha de fin no puede ser anterior a la fecha de inicio.</p>
            )}
            <button type="button" disabled={!fechasValidas} onClick={agregarEquipo}>
              {fechasValidas ? 'Agregar a mi cotización' : 'Elige la fecha de inicio y la de fin'}
            </button>
            {mensaje && <p className="exito" role="status">{mensaje}</p>}
          </section>
          <DesgloseCostos lineas={[{ nombre: equipo.nombre, tarifaDia: equipo.tarifaDia, cantidad, fechaInicio, fechaFin }]} />
        </div>
      </div>
    </>
  );
}
