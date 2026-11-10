import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import EquipmentCatalog from '../../componentes/operacion/EquipmentCatalog.jsx';
import ReservacionesComerciales from '../../componentes/operacion/ReservacionesComerciales.jsx';
import { Modal, RentalSummary, RentalActions, RentalDocuments } from './Operacion.jsx';
import { cargarOperacion, asignarReservacion, registrarOperacion, registrarUnidad } from '../../servicios/operacion.js';
import { etapas, rentasEnEtapa, etapaRenta } from '../../logica/flujo.js';

const fecha = value => value ? new Date(value + 'T12:00:00').toLocaleDateString('es-MX') : 'Sin registrar';
const normalizar = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function FlujoOperacion({ vista }) {
  const { seccion, rentaId } = useParams();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const page = vista || seccion;
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [intento, setIntento] = useState(0);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('fecha');
  const [pagina, setPagina] = useState(1);
  const [tab, setTab] = useState('resumen');
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);
  const escritura = useRef(false);
  const version = useRef(0);
  const rutaActual = useRef(pathname);
  rutaActual.current = pathname;

  useEffect(() => {
    let vigente = true;
    async function cargar() {
      if (escritura.current || document.hidden) return;
      const lectura = ++version.current;
      try {
        const next = await cargarOperacion();
        if (vigente && lectura === version.current) { setData(next); setCargando(false); setErrorCarga(''); }
      } catch {
        if (vigente && lectura === version.current) { setErrorCarga('No se pudo actualizar la operación. Intenta de nuevo.'); setCargando(false); }
      }
    }
    cargar();
    window.addEventListener('focus', cargar);
    document.addEventListener('visibilitychange', cargar);
    return () => { vigente = false; window.removeEventListener('focus', cargar); document.removeEventListener('visibilitychange', cargar); };
  }, [pathname, intento]);
  useEffect(() => { setQuery(''); setPagina(1); setTab('resumen'); setModal(null); setError(''); setConfirmacion(null); }, [pathname]);

  async function guardar(accion, mensaje) {
    if (escritura.current) throw new Error('Espera a que termine el guardado.');
    escritura.current = true; version.current++; setGuardando(true); setError('');
    const ruta = pathname;
    try {
      const next = await accion();
      setData(next);
      if (ruta === rutaActual.current) { setModal(null); setConfirmacion(mensaje(next)); }
      return next;
    } finally { escritura.current = false; setGuardando(false); }
  }
  const asignar = (id, unidades) => guardar(() => asignarReservacion(id, unidades), next => ({
    titulo: 'Unidades asignadas', texto: 'La asignación quedó guardada. Cuando estés listo, revisa la preparación de cada equipo.',
    rentas: next.rentals.filter(r => r.cotizacionId === id),
  }));
  const registrar = (id, unidad) => guardar(() => registrarUnidad(id, unidad), () => ({ titulo: 'Unidad registrada', texto: 'Ya puedes consultarla en el inventario o asignarla a una cotización aprobada.' }));
  const operar = async (accion, campos) => {
    try {
      await guardar(() => registrarOperacion(rentaId, accion, campos), next => ({ titulo: 'Cambio guardado', texto: next.rentals.find(r => r.id === rentaId).events.at(-1).text + '. Puedes revisar el resumen antes de continuar.' }));
    } catch (fallo) { setError(fallo.message); }
  };

  if (!['inicio', 'detalle', 'equipos', 'historial', ...etapas.map(e => e.id)].includes(page)) return <Navigate to="/gestion/operacion/por-asignar" replace />;
  const rental = data?.rentals.find(r => r.id === rentaId);
  const unit = rental && data.units.find(u => u.id === rental.unit);
  const pendientes = data?.reservaciones ?? [];
  const foco = new URLSearchParams(search).get('cotizacion');
  const aviso = confirmacion && <section className="flow-notice" role="status">
    <div className="persistent-success"><h2>{confirmacion.titulo}</h2><button className="button plain compact" onClick={() => setConfirmacion(null)} aria-label="Cerrar confirmación">Cerrar</button></div>
    <p>{confirmacion.texto}</p>
    {confirmacion.rentas?.map(r => <Link key={r.id} className="button soft" to={'/gestion/rentas/' + r.id}>Revisar {r.unit} →</Link>)}
  </section>;
  const abrir = id => navigate('/gestion/rentas/' + encodeURIComponent(id));

  function listado(bucket) {
    const items = rentasEnEtapa(data, bucket).filter(r => {
      const u = data.units.find(u => u.id === r.unit);
      return normalizar([r.id, r.commercial, r.client, u?.name, r.unit].join(' ')).includes(normalizar(query));
    }).sort((a, b) => sort === 'fecha' ? a.end.localeCompare(b.end) : a.id.localeCompare(b.id));
    const cantidad = Math.max(1, Math.ceil(items.length / 8));
    const actual = Math.min(pagina, cantidad);
    return <section className="panel">
      <div className="list-toolbar"><label>Buscar cliente, folio o unidad<input value={query} onChange={e => { setQuery(e.target.value); setPagina(1); }} type="search" /></label><label>Ordenar por<select value={sort} onChange={e => { setSort(e.target.value); setPagina(1); }}><option value="fecha">Fecha de regreso prevista</option><option value="folio">Folio de renta</option></select></label></div>
      {!items.length ? <div className="empty"><h2>{query ? 'Sin coincidencias' : 'No hay equipos en esta etapa'}</h2><p>{query ? 'Prueba con otro folio, cliente o unidad.' : 'Aquí aparecerán al avanzar desde la etapa anterior.'}</p></div> : <>
        <div className="table-scroll"><table className="gestion-table"><thead><tr><th>Equipo y unidad</th><th>Cliente / Cotización</th><th>Periodo previsto</th><th>Etapa</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>
          {items.slice((actual - 1) * 8, actual * 8).map(r => <tr key={r.id}>
            <td><strong>{data.units.find(u => u.id === r.unit)?.name || r.unit}</strong><small>{r.unit} · {r.id}</small></td>
            <td>{r.client}<small>{r.commercial}</small></td><td>{fecha(r.start)}<small>al {fecha(r.end)}</small></td><td>{etapaRenta(r).titulo}</td>
            <td><button className="button soft compact" onClick={() => abrir(r.id)}>Ver detalle →</button></td>
          </tr>)}
        </tbody></table></div>
        <footer className="list-footer"><span>{items.length} unidades</span><div><button className="button plain compact" disabled={actual === 1} onClick={() => setPagina(actual - 1)}>Anterior</button><span>{actual} de {cantidad}</span><button className="button plain compact" disabled={actual === cantidad} onClick={() => setPagina(actual + 1)}>Siguiente</button></div></footer>
      </>}
    </section>;
  }

  return <>
    {errorCarga && <div className="alert" role="alert">{errorCarga} <button className="button soft" onClick={() => setIntento(n => n + 1)}>Volver a intentar</button></div>}
    {cargando || !data ? <p role="status">{errorCarga ? 'Los datos todavía no están disponibles.' : 'Cargando operación…'}</p> : <>
      {aviso}
      {page === 'inicio' ? <>
        <div className="page-heading"><div><p className="eyebrow">TU ESPACIO DE TRABAJO</p><h1>Una renta, paso a paso</h1><p className="section-intro">Empieza por una cotización o retoma una operación pendiente. Cada equipo muestra qué sigue.</p></div></div>
        <ol className="workflow-steps" aria-label="Recorrido de una renta">{['Revisar cotización', 'Asignar unidades', 'Preparar y entregar', 'Registrar regreso', 'Revisar y cerrar'].map((s, i) => <li key={s}><span>PASO {i + 1}</span>{s}</li>)}</ol>
        <div className="home-grid">
          <Link className="home-card" to="/gestion/cotizaciones"><span>COMERCIAL</span><h2>Revisar cotizaciones</h2><p>Consulta las solicitudes del cliente y aprueba las que pasarán a Operación.</p><strong>Ir a cotizaciones →</strong></Link>
          {etapas.map(e => <Link key={e.id} className="home-card" to={'/gestion/operacion/' + e.id}><span className="home-count">{e.id === 'por-asignar' ? pendientes.length : rentasEnEtapa(data, e.id).length}</span><h2>{e.titulo}</h2><p>{e.descripcion}</p><strong>{e.id === 'por-asignar' ? 'Ver cotizaciones' : 'Ver equipos'} →</strong></Link>)}
        </div>
      </> : page === 'equipos' ? <EquipmentCatalog units={data.units} catalogo={data.catalogo ?? []} reservaciones={pendientes} rentals={data.rentals} onRegister={registrar} />
        : page === 'historial' ? <><h1>Historial de rentas</h1><p className="section-intro">Consulta las rentas cerradas y los movimientos de cada unidad.</p>{listado('historial')}</>
        : page === 'detalle' ? !rental || !unit ? <section className="panel"><h1>No encontramos esta renta</h1><Link to="/gestion/operacion">Volver a Operación</Link></section> : <>
          <div className="breadcrumbs"><Link to={rental.status === 'Cerrada' ? '/gestion/historial' : '/gestion/operacion/' + etapaRenta(rental).id}>← Volver a {etapaRenta(rental).titulo.toLowerCase()}</Link><span>{rental.id} · {rental.commercial}</span></div>
          <div className="page-heading"><div><p className="eyebrow">{etapaRenta(rental).titulo}</p><h1>{unit.name}</h1><p>{rental.client} · Unidad {unit.id}</p></div></div>
          <Progreso rental={rental} />
          {rental.cotizacionId && <div className="related-rentals"><Link to={'/gestion/cotizaciones/' + rental.cotizacionId}>Ver cotización {rental.commercial}</Link>{data.rentals.filter(r => r.cotizacionId === rental.cotizacionId && r.id !== rental.id).map(r => <Link key={r.id} to={'/gestion/rentas/' + r.id}>{r.unit} · {etapaRenta(r).titulo}</Link>)}</div>}
          <div className="tabs"><button className={tab === 'resumen' ? 'selected' : ''} onClick={() => setTab('resumen')}>Resumen</button><button className={tab === 'documentos' ? 'selected' : ''} onClick={() => setTab('documentos')}>Documentos</button><button className={tab === 'movimientos' ? 'selected' : ''} onClick={() => setTab('movimientos')}>Movimientos</button></div>
          {tab === 'resumen' ? <><RentalSummary rental={rental} unit={unit} /><RentalActions rental={rental} unit={unit} onAction={action => { setError(''); setModal(action); }} /></>
            : tab === 'documentos' ? <RentalDocuments rental={rental} onAction={action => { setError(''); setModal(action); }} />
              : <section className="panel"><h2>Movimientos de esta unidad</h2><ol className="timeline">{[...rental.events].reverse().map((ev, i) => <li key={i}><span className="timeline-dot" /><div><strong>{ev.text}</strong><small>{new Date(ev.at).toLocaleString('es-MX')} · {ev.by}</small></div></li>)}</ol></section>}
        </> : <>
          <div className="operation-header"><h1>Operación</h1><p className="section-intro">Elige una etapa y abre un registro para revisar su siguiente paso.</p></div>
          <nav className="stage-tabs" aria-label="Etapas de operación">{etapas.map(e => <NavLink key={e.id} to={'/gestion/operacion/' + e.id}>{e.titulo}<small>{e.id === 'por-asignar' ? pendientes.length : rentasEnEtapa(data, e.id).length}</small></NavLink>)}</nav>
          <div className="page-heading"><div><h2>{etapas.find(e => e.id === page)?.titulo}</h2><p>{etapas.find(e => e.id === page)?.descripcion}</p></div></div>
          {page === 'por-asignar' ? <>
            {foco && !confirmacion?.rentas && !pendientes.some(c => String(c.id) === foco) && <section className="flow-notice"><h2>{data.rentals.some(r => String(r.cotizacionId) === foco) ? 'Esta cotización ya tiene unidades asignadas' : 'La cotización no está pendiente de asignación'}</h2><p>Puedes revisar su detalle y continuar desde ahí.</p><Link to={'/gestion/cotizaciones/' + encodeURIComponent(foco)}>Ver cotización →</Link></section>}
            <div className="list-toolbar"><label>Buscar cotización o cliente<input type="search" value={query} onChange={e => setQuery(e.target.value)} /></label></div>
            <ReservacionesComerciales reservaciones={pendientes.filter(c => normalizar([c.folio, c.cliente.nombre, ...c.lineas.map(l => l.equipo)].join(' ')).includes(normalizar(query)))} onAssign={asignar} units={data.units} foco={foco} />
          </> : listado(page)}
        </>}
      {modal && rental && createPortal(<div className="operacion gestion"><Modal kind={modal} rental={rental} unit={unit} error={error} busy={guardando} onClose={() => { if (!escritura.current) { setModal(null); setError(''); } }} onSubmit={operar} /></div>, document.body)}
    </>}
  </>;
}

function Progreso({ rental }) {
  const actual = rental.status === 'Apartado' ? 0 : rental.status === 'En mantenimiento' ? 1 : rental.status === 'En preparación' ? (rental.ready ? 2 : 1) : rental.status === 'En renta' ? 3 : 4;
  const pasos = ['Unidad asignada', 'Preparación', 'Lista para entregar', 'En renta', rental.status === 'Cerrada' ? 'Renta cerrada' : 'Revisión final'];
  return <ol className="workflow-steps" aria-label="Avance de la unidad">{pasos.map((s, i) => <li key={i} className={i === actual ? 'current' : i < actual ? 'complete' : ''} aria-current={i === actual ? 'step' : undefined}><span>{i < actual ? 'COMPLETADO' : 'PASO ' + (i + 1)}</span>{s}</li>)}</ol>;
}
