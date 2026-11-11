// Dueño: Katia · HU-10 Consultar cotizaciones (KAN-19)
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Estado from '../componentes/Estado.jsx';
import BotonAprobar from '../componentes/BotonAprobar.jsx';   // Héctor · HU-15a
import { cargarOperacion } from '../servicios/operacion.js';
import { etapaRenta } from '../logica/flujo.js';
import { dinero, fecha } from '@compartido/formato.js';

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
    api.get(`/cotizaciones/${id}`).then(c => { if (vigente) setCot(c); }).catch(e => { if (vigente) setError(e.message); });
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

  if (error) return <p className="error">{error}</p>;
  if (!cot) return <p>Cargando…</p>;
  const c = cot.cliente;

  return (
    <section>
      <p><Link to="/gestion/cotizaciones">← Volver a cotizaciones</Link></p>
      <h1>{cot.folio} <Estado valor={cot.estado} /></h1>
      <p className="tenue">Origen: {cot.origen} · Recibida el {new Date(cot.creadaEn).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
      {cot.estado === 'Aprobada' && <section className="flow-notice" role="status">
        <h2>{aprobadaAhora ? 'Cotización aprobada' : 'Seguimiento de la cotización'}</h2>
        {falloSeguimiento ? <><p>No se pudo consultar la asignación de unidades.</p><button className="button soft" onClick={() => setIntento(n => n + 1)}>Volver a intentar</button></> : seguimiento === null ? <p>Consultando el siguiente paso…</p> : seguimiento.length ? <>
          <p>Las unidades ya están asignadas. Cada una avanza a su propio ritmo; abre su detalle para continuar.</p>
          {seguimiento.map(r => <Link className="button soft" key={r.id} to={'/gestion/rentas/' + r.id}>{r.unit} · {etapaRenta(r).titulo} →</Link>)}
        </> : <><p>La revisión comercial terminó. El siguiente paso es elegir las unidades físicas; todavía no se ha entregado ningún equipo.</p><Link className="button dark" to={'/gestion/operacion/por-asignar?cotizacion=' + cot.id}>Continuar a asignación →</Link></>}
      </section>}

      <div className="commercial-grid" style={{ marginTop: 16 }}>
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Equipos</h2>
          <div className="table-scroll"><table className="gestion-table">
            <tbody>
              {cot.lineas.map((l) => (
                <tr key={l.id}>
                  <td>{l.equipo}<br /><small className="tenue">{l.cantidad} u. × {l.dias} día/s × {dinero(l.tarifaDia)} · del {fecha(l.fechaInicio)} al {fecha(l.fechaFin)}</small></td>
                  <td>{dinero(l.importe)}</td>
                </tr>
              ))}
              <tr><td>Subtotal</td><td>{dinero(cot.subtotal)}</td></tr>
              <tr><td>IVA (16 %)</td><td>{dinero(cot.iva)}</td></tr>
              <tr className="total"><td>Total</td><td>{dinero(cot.total)}</td></tr>
            </tbody>
          </table></div>
          {cot.notas && <p><b>Notas:</b> {cot.notas}</p>}
        </div>

        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Cliente</h2>
          <p><b>{c.nombre}</b>{c.empresa && <> · {c.empresa}</>}</p>
          <p className="tenue">WhatsApp: {c.telefono}</p>
          <p className="tenue">Correo: {c.correo}</p>
          <p className="tenue">Entrega: {c.direccion}, {c.municipio}</p>
        </div>
      </div>
      {cot.estado === 'Pendiente' && <section className="panel simple-actions"><div className="next-step"><div><h2>1. Revisar y aprobar</h2><p>Comprueba equipos, fechas, costos y dirección. Aprobar enviará esta solicitud a la etapa “Por asignar”.</p></div><BotonAprobar key={cot.id} cotizacion={cot} onAprobada={r => { setCot(actual => ({ ...actual, estado: r.estado })); setAprobadaAhora(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} /></div></section>}
    </section>
  );
}
