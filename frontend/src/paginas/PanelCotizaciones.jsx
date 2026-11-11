// Dueño: Katia · HU-10 Consultar cotizaciones (KAN-19)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Estado from '../componentes/Estado.jsx';
import { dinero, fecha } from '@compartido/formato.js';

export default function PanelCotizaciones() {
  const [estado, setEstado] = useState('Pendiente');
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [lista, setLista] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    setCargando(true); setError('');
    const espera = setTimeout(() => {              // busca 300 ms después de dejar de escribir
      api.get(`/cotizaciones?q=${encodeURIComponent(busqueda)}`)
        .then(data => { if (vigente) setLista(data); })
        .catch(e => { if (vigente) setError(e.message); })
        .finally(() => { if (vigente) setCargando(false); });
    }, 300);
    return () => { vigente = false; clearTimeout(espera); };
  }, [busqueda, intento]);
  const visibles = (lista ?? []).filter(c => !estado || c.estado === estado);

  return (
    <section>
      <div className="page-heading"><div><p className="eyebrow">PRIMER PASO · COMERCIAL</p><h1>Cotizaciones</h1><p>Revisa los equipos y los datos del cliente. Al aprobar, podrás continuar con la asignación de unidades.</p></div></div>
      <div className="panel">
      <div className="list-toolbar"><label>Buscar folio o cliente<input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></label><label>Mostrar<select value={estado} onChange={e => setEstado(e.target.value)}><option value="Pendiente">Pendientes de revisión</option><option value="Aprobada">Aprobadas</option><option value="">Todas</option></select></label></div>
      {error ? <div className="alert" role="alert">{error} <button className="button soft" onClick={() => setIntento(n => n + 1)}>Volver a intentar</button></div> : cargando ? <p role="status">Buscando cotizaciones…</p> : !visibles.length ? <div className="empty"><h2>No hay cotizaciones en esta vista</h2><p>Cambia el filtro o busca otro folio.</p></div> : (
        <div className="table-scroll"><table className="gestion-table">
          <thead>
            <tr><th>Folio</th><th>Cliente</th><th>Origen</th><th>Fechas de renta</th><th>Total</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr>
          </thead>
          <tbody>
            {visibles.map((c) => (
              <tr key={c.id}>
                <td><Link to={'/gestion/cotizaciones/' + c.id}><b>{c.folio}</b></Link></td>
                <td>{c.cliente}</td>
                <td>{c.origen}</td>
                <td>{fecha(c.fechaInicio)} al {fecha(c.fechaFin)}</td>
                <td>{dinero(c.total)}</td>
                <td><Estado valor={c.estado} /></td>
                <td><Link className="button soft compact" to={'/gestion/cotizaciones/' + c.id}>{c.estado === 'Pendiente' ? 'Revisar' : 'Ver seguimiento'} →</Link></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      </div>
    </section>
  );
}
