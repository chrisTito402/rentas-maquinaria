// Dueño: Héctor · HU-04 Ver detalle del equipo (KAN-8)
// Diseño: frames «2 · Detalle del equipo» y «Ficha · Estado sin fechas (HU-04)» del Figma.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useCarrito } from '../carrito/CarritoContext.jsx';
import DesgloseCostos from '../componentes/DesgloseCostos.jsx';
import CalendarioRango from '../componentes/CalendarioRango.jsx';
import Maquina from '../componentes/Maquina.jsx';
import { imagenEquipo, partesCaracteristicas } from '../logica/imagenEquipo.js';
import { MAX_CANTIDAD } from '@compartido/constantes.js';
import { contarDias } from '@compartido/costos.js';
import { dinero, fecha } from '@compartido/formato.js';

const rangoCorto = (inicio, fin) => {
  const f = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  return `${f(inicio)} al ${f(fin)}`;
};

export default function DetalleEquipo() {
  const { id } = useParams();
  const { agregar } = useCarrito();
  const [equipo, setEquipo] = useState(null);
  const [error, setError] = useState('');
  const [cantidad, setCantidad] = useState(1);
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

  if (error) return (
    <div className="f-tarjeta confirmacion">
      <h1>Equipo no disponible</h1>
      <p>{error}</p>
      <Link className="f-btn f-btn--primario" to="/">Volver al catálogo</Link>
    </div>
  );
  if (!equipo) return <p className="f-cargando" role="status">Cargando equipo…</p>;

  const dias = contarDias(fechaInicio, fechaFin);
  const fechasValidas = dias > 0;
  const cambiarCantidad = (n) => { setCantidad(Math.min(MAX_CANTIDAD, Math.max(1, n))); setMensaje(''); };

  function agregarEquipo() {
    agregar({
      equipoId: equipo.id, nombre: equipo.nombre, foto: imagenEquipo(equipo), tarifaDia: equipo.tarifaDia,
      cantidad, fechaInicio, fechaFin,
    });
    setMensaje(`${cantidad} × ${equipo.nombre} se agregó a tu cotización (${fecha(fechaInicio)} al ${fecha(fechaFin)}).`);
  }

  const datos = [
    { etiqueta: 'Tipo', valor: equipo.tipo },
    { etiqueta: 'Modelo', valor: equipo.modelo },
    ...partesCaracteristicas(equipo.caracteristicas).map((parte) => {
      // 'Capacidad de carga 2.5 t' -> etiqueta 'Capacidad de carga', valor '2.5 t'
      const m = parte.match(/^([^\d]{4,}?)\s+(?:de\s+)?(\d.*)$/i);
      return m ? { etiqueta: m[1].replace(/\s+de$/i, ''), valor: m[2] } : { etiqueta: 'Característica', valor: parte };
    }),
  ];

  return (
    <>
      <nav className="migas" aria-label="Ruta">
        <Link className="f-volver" to="/">← Catálogo</Link>
        <span aria-hidden="true">/</span>
        <span>{equipo.tipo}</span>
        <span aria-hidden="true">/</span>
        <strong>{equipo.nombre}</strong>
      </nav>

      <div className="ficha">
        <div className="ficha-izquierda">
          <section className="f-tarjeta ficha-imagen">
            <div className="ficha-imagen__fondo"><Maquina equipo={equipo} grande /></div>
          </section>
          <section className="f-tarjeta ficha-tecnica" aria-labelledby="titulo-tecnica">
            <div className="ficha-tecnica__titulo">
              <h2 id="titulo-tecnica">Características técnicas</h2>
              <span className="ficha-tecnica__etiqueta">FICHA OPERATIVA</span>
            </div>
            <div className="ficha-datos">
              {datos.map((dato, i) => (
                <div className="ficha-dato" key={i}>
                  <span>{dato.etiqueta}</span>
                  <strong>{dato.valor}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="f-tarjeta ficha-panel" aria-label="Agregar a mi cotización">
          <h1>{equipo.nombre}</h1>
          <p className="ficha-precio">{dinero(equipo.tarifaDia).replace('.00', '')}<small>/ día + IVA</small></p>

          <div className="ficha-seccion-titulo">
            <div>
              <strong>Elige tus fechas</strong>
              <small>Toca el primer día de renta y luego el último.</small>
            </div>
          </div>
          <CalendarioRango
            inicio={fechaInicio} fin={fechaFin}
            onCambio={(inicio, fin) => { setFechaInicio(inicio); setFechaFin(fin); setMensaje(''); }}
          />

          <div className="ficha-cantidad">
            <strong id="etiqueta-cantidad">Cantidad</strong>
            <div className="paso" role="group" aria-labelledby="etiqueta-cantidad">
              <button type="button" onClick={() => cambiarCantidad(cantidad - 1)} disabled={cantidad <= 1} aria-label="Quitar una unidad">−</button>
              <output aria-live="polite">{cantidad}</output>
              <button type="button" onClick={() => cambiarCantidad(cantidad + 1)} disabled={cantidad >= MAX_CANTIDAD} aria-label="Agregar una unidad">+</button>
            </div>
            <span className="ficha-cantidad__nota">Máximo {MAX_CANTIDAD} unidades.</span>
          </div>

          <div className="ficha-costo">
            <div className="ficha-costo__titulo">
              <strong>Costo estimado</strong>
              {fechasValidas && <span>{rangoCorto(fechaInicio, fechaFin)}</span>}
            </div>
            {fechasValidas
              ? <DesgloseCostos detalle lineas={[{ nombre: equipo.nombre, tarifaDia: equipo.tarifaDia, cantidad, fechaInicio, fechaFin }]} />
              : <p className="f-campo__ayuda">Elige la fecha de inicio y la de fin para ver el costo.</p>}
          </div>

          <button type="button" className="f-btn f-btn--primario f-btn--grande" disabled={!fechasValidas} onClick={agregarEquipo}>
            {fechasValidas ? 'Agregar a mi cotización' : 'Elige la fecha de inicio y la de fin'}
          </button>
          {mensaje ? (
            <div className="ficha-agregado">
              <p className="f-alerta f-alerta--exito" role="status">{mensaje}</p>
              <Link className="f-enlace" to="/mi-cotizacion">Ver mi cotización →</Link>
            </div>
          ) : (
            <p className="ficha-nota-cobro">No se realiza ningún cobro en este paso.</p>
          )}
        </aside>
      </div>
    </>
  );
}
