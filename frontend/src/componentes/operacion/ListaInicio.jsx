import { useState } from 'react';

const porFolio = new Intl.Collator('es-MX', { numeric: true });
const fecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

export default function ListaInicio({ reservaciones, rentas, units, activas, asignar, abrir }) {
  const [orden, setOrden] = useState('folio');
  const [pagina, setPagina] = useState(1);
  const [ocupada, setOcupada] = useState(null);
  const [error, setError] = useState('');
  const filas = rentas.map(r => ({
    clave: 'r-' + r.id, folio: r.commercial || r.id, nombre: units.find(u => u.id === r.unit)?.name || r.unit,
    unidad: r.unit, cliente: r.client, dia: activas ? r.end : r.start, renta: r.id,
  }));
  for (const cot of reservaciones) {
    for (const linea of cot.lineas) filas.push({
      clave: 'c-' + cot.id + '-' + linea.id, folio: cot.folio, nombre: linea.equipo,
      unidad: cot.folio + ' · ' + linea.cantidad + (linea.cantidad === 1 ? ' unidad' : ' unidades'),
      cliente: cot.cliente.nombre, dia: linea.inicio, cotizacion: cot.id,
    });
  }
  filas.sort((a, b) => orden === 'fecha' ? a.dia.localeCompare(b.dia) : porFolio.compare(a.folio, b.folio));
  const paginas = Math.max(1, Math.ceil(filas.length / 3));
  const actual = Math.min(pagina, paginas);
  async function preparar(fila) {
    if (fila.renta) return abrir(fila.renta);
    setError('');
    setOcupada(fila.cotizacion);
    try {
      const data = await asignar(fila.cotizacion);
      const nuevas = data.rentals.filter(r => r.cotizacionId === fila.cotizacion);
      if (nuevas.length === 1) abrir(nuevas[0].id);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setOcupada(null);
    }
  }

  return <section className="inicio-lista" aria-label={activas ? 'Rentas activas' : 'Reservaciones'}>
    <header><div><h2>{activas ? 'Rentas activas' : 'Reservaciones'}</h2>
      <p>{activas ? 'Consulta una renta.' : 'Selecciona un equipo para prepararlo.'}</p></div>
      <select aria-label="Orden de los registros" value={orden} onChange={e => { setOrden(e.target.value); setPagina(1); }}>
        <option value="folio">Ordenar por folio</option><option value="fecha">Ordenar por fecha</option>
      </select></header>
    {error && <p className="alert" role="alert">{error}</p>}
    {filas.length ? <div className="inicio-tabla"><table><thead><tr><th>Equipo</th><th>Cliente</th><th>{activas ? 'Regreso' : 'Entrega'}</th><th aria-label="Acción" /></tr></thead>
      <tbody>{filas.slice((actual - 1) * 3, actual * 3).map(fila => <tr key={fila.clave}>
        <td><strong>{fila.nombre}</strong><small>{fila.unidad}</small></td><td>{fila.cliente}</td>
        <td>{fecha.format(new Date(fila.dia + 'T12:00:00'))}</td>
        <td>{fila.renta || asignar ? <button className="button primary" disabled={ocupada !== null} onClick={() => void preparar(fila)}>
          {activas || !asignar ? 'Ver renta' : ocupada !== null && ocupada === fila.cotizacion ? 'Asignando…' : 'Preparar'} <span aria-hidden="true">→</span>
        </button> : 'Por asignar'}</td>
      </tr>)}</tbody></table></div> : <p className="inicio-vacio">{activas ? 'No hay rentas activas' : 'No hay reservaciones pendientes'}</p>}
    <footer><span>{filas.length} {filas.length === 1 ? 'registro' : 'registros'}</span><div>
      <button disabled={actual === 1} onClick={() => setPagina(actual - 1)}>Anterior</button>
      <span>{actual} de {paginas}</span><button disabled={actual === paginas} onClick={() => setPagina(actual + 1)}>Siguiente</button>
    </div></footer>
  </section>;
}
