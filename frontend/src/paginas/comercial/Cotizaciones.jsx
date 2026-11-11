// Dueño: Katia · HU-10 Consultar cotizaciones (KAN-19)
// Diseño: frame «1 · Bandeja de solicitudes» del Figma. Los filtros por estado y origen llegan con HU-16.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import { dinero } from '@compartido/formato.js';

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
  return <span className={`f-estado f-estado--${String(valor || '').toLowerCase()}`}>{valor}</span>;
}

export default function Cotizaciones() {
  const navegar = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [lista, setLista] = useState(null);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setError('');
    const espera = setTimeout(() => {              // busca 300 ms después de dejar de escribir
      api.get(`/cotizaciones?q=${encodeURIComponent(busqueda)}`)
        .then((datos) => { if (vigente) setLista(datos); })
        .catch((e) => { if (vigente) setError(e.message); });
    }, 300);
    return () => { vigente = false; clearTimeout(espera); };
  }, [busqueda, intento]);

  return (
    <>
      <header className="comercial-encabezado">
        <div>
          <h1>Cotizaciones</h1>
          <p>Solicitudes recibidas desde la página web.</p>
        </div>
        <span className="comercial-perfil"><i>AD</i>Administrador</span>
      </header>

      <section className="f-tarjeta bandeja">
        <div className="bandeja__filtros">
          <div className="f-campo">
            <label htmlFor="buscar" className="sr-only">Buscar por cliente o folio</label>
            <input id="buscar" type="search" placeholder="Buscar por cliente o folio" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
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
          <div className="bandeja__vacio"><p>{busqueda ? 'No hay cotizaciones con esa búsqueda.' : 'Todavía no hay cotizaciones.'}</p></div>
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
