import { Link } from 'react-router-dom';

const ficha = id => '/comercial/inventario/' + encodeURIComponent(id);
const detalle = id => '/comercial/rentas/' + encodeURIComponent(id);

export default function PendientesEquipo({ data }) {
  const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Hermosillo' });
  const limite = new Date(hoy + 'T12:00:00Z');
  limite.setUTCDate(limite.getUTCDate() + 7);
  const fin = limite.toISOString().slice(0, 10);
  const agenda = [];
  const pendientes = [];
  for (const r of data.rentals) {
    const entrega = r.status === 'En preparación' && r.ready;
    const fecha = entrega ? r.start : r.end;
    if ((entrega || r.status === 'En renta') && fecha <= fin) agenda.push({ fecha, url: detalle(r.id), texto: (entrega ? 'Entrega' : 'Regreso') + ' · ' + r.unit + ' · ' + r.id });
    for (const f of r.issues ?? []) if (['Pendiente', 'Taller'].includes(f.estado)) {
      pendientes.push({ url: detalle(r.id), texto: 'Falla · ' + r.unit + ' · ' + f.detalle, id: r.id + '/' + f.id });
    }
  }
  for (const u of data.units) {
    const ordenes = (u.taller ?? []).filter(o => o.estado !== 'Terminado');
    for (const o of ordenes) pendientes.push({ url: ficha(u.id), texto: o.estado + ' · ' + u.id + ' · ' + o.detalle, id: u.id + '/' + o.at });
    if (u.state === 'En mantenimiento' && !ordenes.some(o => o.estado === 'En taller')) pendientes.push({ url: ficha(u.id), texto: 'Mantenimiento · ' + u.id, id: u.id });
  }
  return <div className="home-grid"><section className="panel"><h2>Entregas y regresos</h2><p>Atrasados y próximos 7 días</p>
    {agenda.length ? <ul>{agenda.sort((a,b) => a.fecha.localeCompare(b.fecha)).map(a => <li key={a.url}><Link to={a.url}>{a.texto} · {a.fecha}{a.fecha < hoy ? ' · Atrasado' : ''}</Link></li>)}</ul> : <p>Sin entregas o regresos en este periodo</p>}</section>
    <section className="panel"><h2>Fallas y taller ({pendientes.length})</h2>
    {pendientes.length ? <ul>{pendientes.map(p => <li key={p.id}><Link to={p.url}>{p.texto}</Link></li>)}</ul> : <p>Sin pendientes</p>}</section></div>;
}
