// Dueños: Katia · HU-10 Consultar cotizaciones (KAN-19) · Héctor · HU-15a Aprobar cotización (KAN-15)
// Diseño: frames «2 · Detalle de solicitud» y «3a · Confirmación: aprobada» del Figma.
// Rechazar con motivo (HU-15b) y el PDF (HU-07) llegan en sprints posteriores.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api.js';
import BotonAprobar from '../../componentes/BotonAprobar.jsx';
import { cargarOperacion } from '../../servicios/operacion.js';
import { etapaRenta } from '../../logica/flujo.js';
import { EstadoCotizacion } from './Cotizaciones.jsx';
import ProximoSprint from '../../componentes/ProximoSprint.jsx';
import { dinero } from '@compartido/formato.js';

const corta = (iso) => new Date(`${String(iso).slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
const recibida = (iso) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function DetalleCotizacion() {
  const { id } = useParams();
  const [cot, setCot] = useState(null);
  const [error, setError] = useState('');
  const [aprobadaAhora, setAprobadaAhora] = useState(false);
  const [seguimiento, setSeguimiento] = useState(null);
  const [falloSeguimiento, setFalloSeguimiento] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCot(null); setError(''); setAprobadaAhora(false);
    api.get(`/cotizaciones/${id}`).then((c) => { if (vigente) setCot(c); }).catch((e) => { if (vigente) setError(e.message); });
    return () => { vigente = false; };
  }, [id]);
  useEffect(() => {
    let vigente = true;
    setSeguimiento(null); setFalloSeguimiento(false);
    if (cot?.estado === 'Aprobada') cargarOperacion()
      .then(data => { if (vigente) setSeguimiento(data.rentals.filter(r => String(r.cotizacionId) === id)); })
      .catch(() => { if (vigente) setFalloSeguimiento(true); });
    return () => { vigente = false; };
  }, [cot?.estado, id, intento]);

  if (error) return (
    <div className="f-tarjeta confirmacion">
      <h1>No encontramos la cotización</h1>
      <p>{error}</p>
      <Link className="f-btn f-btn--primario" to="/gestion/cotizaciones">Volver a cotizaciones</Link>
    </div>
  );
  if (!cot) return <p className="f-cargando" role="status">Cargando cotización…</p>;
  const c = cot.cliente;


  return (
    <>
      <Link className="f-volver" to="/gestion/cotizaciones">← Volver a cotizaciones</Link>
      <header className="comercial-encabezado" style={{ marginTop: 12 }}>
        <div>
          <h1>Cotización {cot.folio} <EstadoCotizacion valor={cot.estado} /></h1>
          <p>Recibida el {recibida(cot.creadaEn)} desde {cot.origen === 'Web' ? 'el formulario web' : 'el panel'}</p>
        </div>
      </header>

      {cot.estado === 'Aprobada' && <section className="f-tarjeta detalle-bloque seguimiento-comercial" role="status">
        <h2>{aprobadaAhora ? 'Cotización aprobada' : 'Seguimiento de la cotización'}</h2>
        {falloSeguimiento ? <><p>No se pudo consultar la asignación de unidades.</p><button className="f-btn f-btn--secundario" onClick={() => setIntento(n => n + 1)}>Volver a intentar</button></> : seguimiento === null ? <p>Consultando el siguiente paso…</p> : seguimiento.length ? <>
          <p>Las unidades ya están asignadas. Cada una avanza a su propio ritmo; abre su detalle para continuar.</p>
          {seguimiento.map(r => <Link className="f-btn f-btn--secundario" key={r.id} to={'/gestion/rentas/' + r.id}>{r.unit} · {etapaRenta(r).titulo} →</Link>)}
        </> : <><p>La revisión comercial terminó. El siguiente paso es elegir las unidades físicas; todavía no se ha entregado ningún equipo.</p><Link className="f-btn f-btn--primario" to={'/gestion/operacion/por-asignar?cotizacion=' + cot.id}>Continuar a asignación →</Link></>}
      </section>}

      <div className="detalle">
        <div className="detalle__columna">
          <section className="f-tarjeta detalle-bloque" aria-labelledby="titulo-cliente">
            <h2 className="detalle-bloque__titulo" id="titulo-cliente">Datos del cliente</h2>
            <div className="datos-cliente">
              <div><span>Empresa</span><strong>{c.empresa || 'Sin empresa'}</strong></div>
              <div><span>Contacto</span><strong>{c.nombre}</strong></div>
              <div><span>WhatsApp</span><strong>{c.telefono}</strong></div>
              <div><span>Correo</span><strong>{c.correo}</strong></div>
              <div className="ancho"><span>Municipio y dirección de entrega</span><strong>{c.municipio} · {c.direccion}</strong></div>
            </div>
          </section>

          <section className="f-tarjeta detalle-equipos" aria-labelledby="titulo-equipos">
            <h2 className="detalle-bloque__titulo" id="titulo-equipos">Equipos solicitados</h2>
            <table className="tabla-f">
              <thead><tr><th>Equipo</th><th>Fechas</th><th className="num">Días</th><th className="num">Tarifa/día</th><th className="num">Subtotal</th></tr></thead>
              <tbody>
                {cot.lineas.map((l) => (
                  <tr key={l.id}>
                    <td><strong>{l.equipo}</strong>{l.cantidad > 1 && <span className="tabla-f__secundario">{l.cantidad} unidades</span>}</td>
                    <td>{corta(l.fechaInicio)} – {corta(l.fechaFin)}</td>
                    <td className="num">{l.dias}</td>
                    <td className="num">{dinero(l.tarifaDia)}</td>
                    <td className="num"><strong>{dinero(l.importe)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {cot.notas && (
            <section className="f-tarjeta detalle-bloque">
              <h2 className="detalle-bloque__titulo">Notas de entrega</h2>
              <p className="detalle-notas">{cot.notas}</p>
            </section>
          )}
        </div>

        <div className="detalle__columna">
          <section className="f-tarjeta detalle-bloque" aria-labelledby="titulo-costos">
            <h2 className="detalle-bloque__titulo" id="titulo-costos">Desglose de costos</h2>
            <div className="f-desglose">
              <div className="f-desglose__fila"><span>Subtotal de renta</span><strong>{dinero(cot.subtotal)}</strong></div>
              <div className="f-desglose__fila"><span>IVA 16 %</span><strong>{dinero(cot.iva)}</strong></div>
              <div className="f-desglose__total"><span>Total</span><strong style={{ color: 'var(--f-texto)' }}>{dinero(cot.total)}</strong></div>
            </div>
          </section>
          {cot.estado === 'Pendiente' && (
            <div className="detalle-acciones">
              <BotonAprobar key={cot.id} cotizacion={cot} onAprobada={(r) => { setCot((actual) => ({ ...actual, estado: r.estado })); setAprobadaAhora(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </div>
          )}
          <ProximoSprint hu="HU-07" kan="KAN-16" titulo="PDF y envío por WhatsApp">
            Generar la cotización formal en PDF y mandársela al cliente por WhatsApp.
          </ProximoSprint>
        </div>
      </div>
    </>
  );
}
