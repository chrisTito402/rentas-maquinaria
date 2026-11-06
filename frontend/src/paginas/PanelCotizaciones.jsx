// Dueño: Katia · HU-10 Consultar cotizaciones (KAN-19)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import Estado from '../componentes/Estado.jsx';
import { dinero, fecha } from '@compartido/formato.js';

export default function PanelCotizaciones() {
  const navegar = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [lista, setLista] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const espera = setTimeout(() => {              // busca 300 ms después de dejar de escribir
      api.get(`/cotizaciones?q=${encodeURIComponent(busqueda)}`).then(setLista).catch((e) => setError(e.message));
    }, 300);
    return () => clearTimeout(espera);
  }, [busqueda]);

  return (
    <section>
      <h1>Cotizaciones</h1>
      <input placeholder="Buscar por folio o por cliente" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ marginBottom: 14 }} />
      {error && <p className="error">{error}</p>}
      {!lista ? <p>Cargando…</p> : !lista.length ? <p className="tenue">No hay cotizaciones que coincidan.</p> : (
        <table className="tabla">
          <thead>
            <tr><th>Folio</th><th>Cliente</th><th>Origen</th><th>Fechas de renta</th><th>Total</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id} onClick={() => navegar(`/panel/cotizaciones/${c.id}`)}>
                <td><b>{c.folio}</b></td>
                <td>{c.cliente}</td>
                <td>{c.origen}</td>
                <td>{fecha(c.fechaInicio)} al {fecha(c.fechaFin)}</td>
                <td>{dinero(c.total)}</td>
                <td><Estado valor={c.estado} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
