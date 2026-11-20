// Dueño: Katia · HU-10 Consultar cotizaciones (KAN-19)
// Diseño: frame «1 · Bandeja de solicitudes» del Figma. Los filtros por estado y origen llegan con HU-16.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import { dinero } from '@compartido/formato.js';
import { ESTADOS, ORIGENES } from '@compartido/constantes.js';
import './cotizaciones.css';
import { useSesion } from '../../auth/Sesion.jsx';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const corta = (iso) => {
  if (!iso) return '—';
  const [, mes, dia] = String(iso).slice(0, 10).split('-').map(Number);
  return `${dia} ${MESES[mes - 1]}`;
};

function haceCuanto(iso) {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(minutos)) return '';
  if (minutos < 60) return `hace ${Math.max(minutos, 1)} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'ayer' : `hace ${dias} d`;
}

export function EstadoCotizacion({ valor }) {
  return <span className={`f-estado f-estado--${String(valor || '').toLowerCase().replace(' ', '-')}`}>{valor}</span>;
}

export default function Cotizaciones() {
  const navegar = useNavigate();
  const { usuario } = useSesion();
  const esAdmin = usuario?.rol === 'admin';
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [origen, setOrigen] = useState('');
  const [lista, setLista] = useState(null);
  const [conteo, setConteo] = useState({});      // cuántas hay de cada estado, para las pestañas
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setError('');
    const espera = setTimeout(() => {              // busca 300 ms después de dejar de escribir
      // Se pide sin estado para contar las pestañas; la lista se pide ya filtrada.
      const todas = api.get(`/cotizaciones?${new URLSearchParams({ q: busqueda, origen })}`);
      const filtradas = estado ? api.get(`/cotizaciones?${new URLSearchParams({ q: busqueda, estado, origen })}`) : todas;
      Promise.all([todas, filtradas])
        .then(([datosTodas, datos]) => {
          if (!vigente) return;
          const cuenta = {};
          for (const c of datosTodas) cuenta[c.estado] = (cuenta[c.estado] || 0) + 1;
          setConteo({ ...cuenta, total: datosTodas.length });
          setLista(datos);
        })
        .catch((e) => { if (vigente) setError(e.message); });
    }, 300);
    return () => { vigente = false; clearTimeout(espera); };
  }, [busqueda, estado, origen, intento]);

  const hayFiltros = Boolean(busqueda || estado || origen);
  function limpiarFiltros() {
    setBusqueda('');
    setEstado('');
    setOrigen('');
  }

  return (
    <>
      <header className="comercial-encabezado">
        <div>
          <h1>Cotizaciones</h1>
          <p>Consulta y da seguimiento a las cotizaciones.</p>
        </div>
        <div className="comercial-encabezado__acciones">
          <Link className="f-btn f-btn--primario" to="/comercial/cotizaciones/nueva">+ Nueva cotización</Link>
          <span className="comercial-perfil"><i>{esAdmin ? 'AD' : 'AU'}</i>{esAdmin ? 'Administrador' : 'Auxiliar comercial'}</span>
        </div>
      </header>

      <section className="f-tarjeta bandeja">
        <div className="bandeja__filtros bandeja__filtros--hu16">
          <div className="bandeja__pestanas" role="group" aria-label="Filtrar por estado">
            <button type="button" aria-pressed={estado === ''} onClick={() => setEstado('')}>Todas · {conteo.total ?? 0}</button>
            {ESTADOS.map((e) => (
              <button type="button" key={e} aria-pressed={estado === e} onClick={() => setEstado(e)}>{e}s · {conteo[e] ?? 0}</button>
            ))}
          </div>
          <div className="bandeja__busqueda">
            <div className="f-campo">
              <label htmlFor="buscar" className="sr-only">Buscar por cliente o folio</label>
              <input id="buscar" type="search" placeholder="Buscar por cliente o folio" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <div className="f-campo bandeja__origen">
              <label htmlFor="origen" className="sr-only">Filtrar por origen</label>
              <select id="origen" value={origen} onChange={(e) => setOrigen(e.target.value)}>
                <option value="">Origen: Todos</option>
                {ORIGENES.map((o) => <option key={o} value={o}>Origen: {o}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bandeja__vacio" role="alert">
            <p>{error}</p>
            <button className="f-btn f-btn--secundario" type="button" onClick={() => setIntento((n) => n + 1)}>Volver a intentar</button>
          </div>
        ) : lista === null ? (
          <p className="f-cargando" role="status">Buscando cotizaciones…</p>
        ) : lista.length === 0 ? (
          <div className="bandeja__vacio">
            <p>{hayFiltros ? 'No hay cotizaciones con esos filtros.' : 'Todavía no hay cotizaciones.'}</p>
            {hayFiltros && <button className="f-btn f-btn--secundario" type="button" onClick={limpiarFiltros}>Limpiar filtros</button>}
          </div>
        ) : (
          <table className="tabla-f">
            <thead>
              <tr><th>Folio</th><th>Cliente</th><th>Equipos</th><th>Fechas de renta</th><th>Total</th><th>Estado</th><th><span className="sr-only">Abrir</span></th></tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id} onClick={() => navegar(`/comercial/cotizaciones/${c.id}`)}>
                  <td className="tabla-f__folio">
                    <Link to={`/comercial/cotizaciones/${c.id}`} onClick={(e) => e.stopPropagation()}>{c.folio}</Link>
                    <small>{c.origen} · {haceCuanto(c.creadaEn)}</small>
                  </td>
                  <td>
                    <span className="tabla-f__cliente">{c.empresa || c.cliente}</span>
                    {c.empresa && <span className="tabla-f__secundario">{c.cliente}</span>}
                  </td>
                  <td>
                    {c.primerEquipo || '—'}
                    {c.numEquipos > 1 && <span className="tabla-f__secundario">y {c.numEquipos - 1} equipo{c.numEquipos > 2 ? 's' : ''} más</span>}
                  </td>
                  <td className="tabla-f__fechas">{corta(c.fechaInicio)} – {corta(c.fechaFin)}</td>
                  <td className="tabla-f__total">{dinero(c.total)}</td>
                  <td><EstadoCotizacion valor={c.estado} /></td>
                  <td className="tabla-f__flecha" aria-hidden="true">›</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {lista?.length > 0 && <p className="bandeja__pie">{lista.length} {lista.length === 1 ? 'cotización' : 'cotizaciones'} · de la más reciente a la más antigua</p>}
      </section>
    </>
  );
}
