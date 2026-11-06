// Dueño: Katia · HU-10 Consultar cotizaciones (KAN-19)
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Estado from '../componentes/Estado.jsx';
import BotonAprobar from '../componentes/BotonAprobar.jsx';   // Héctor · HU-15a
import { dinero, fecha } from '@compartido/formato.js';

export default function DetalleCotizacion() {
  const { id } = useParams();
  const [cot, setCot] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/cotizaciones/${id}`).then(setCot).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!cot) return <p>Cargando…</p>;
  const c = cot.cliente;

  return (
    <section>
      <p><Link to="/panel/cotizaciones">← Cotizaciones</Link></p>
      <h1>{cot.folio} <Estado valor={cot.estado} /></h1>
      <p className="tenue">Origen: {cot.origen} · Recibida el {fecha(cot.creadaEn)}</p>

      <div className="dos-columnas" style={{ marginTop: 16 }}>
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Equipos</h2>
          <table className="desglose">
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
          </table>
          {cot.notas && <p><b>Notas:</b> {cot.notas}</p>}
        </div>

        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Cliente</h2>
          <p><b>{c.nombre}</b>{c.empresa && <> · {c.empresa}</>}</p>
          <p className="tenue">WhatsApp: {c.telefono}</p>
          <p className="tenue">Correo: {c.correo}</p>
          <p className="tenue">Entrega: {c.direccion}, {c.municipio}</p>
          <BotonAprobar cotizacion={cot} onAprobada={(r) => setCot({ ...cot, estado: r.estado })} />
        </div>
      </div>
    </section>
  );
}
