import { useState } from 'react';
import { Link } from 'react-router-dom';
import { trabajoAbierto } from '@compartido/operacion/taller.js';

const acciones = { programar: 'Programar preventivo', ingresar: 'Registrar ingreso a taller', trabajo: 'Registrar trabajo', liberar: 'Liberar equipo' };

function FormularioTaller({ unidad, guardar }) {
  const abierta = trabajoAbierto(unidad);
  const [accion, setAccion] = useState('');
  const [error, setError] = useState('');
  const [enCurso, setEnCurso] = useState(false);
  const permitidas = abierta ? ['trabajo', 'liberar', 'programar'] : ['ingresar', 'programar'];
  async function enviar(e) {
    e.preventDefault();
    const campos = Object.fromEntries(new FormData(e.currentTarget));
    setError(''); setEnCurso(true);
    try { await guardar(unidad.id, accion, campos); setAccion(''); }
    catch (fallo) { setError(fallo.message); }
    finally { setEnCurso(false); }
  }
  return <section className="panel"><h2>Taller y preventivos</h2>
    <label className="field">Movimiento<select value={accion} disabled={enCurso} onChange={e => { setAccion(e.target.value); setError(''); }}>
      <option value="">Elige una opción</option>{permitidas.map(a => <option key={a} value={a}>{acciones[a]}</option>)}</select></label>
    {accion && <form className="form-grid" key={accion} onSubmit={enviar}>
      <label className="field">Fecha<input name="date" required type="date" defaultValue={new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Hermosillo' })} /></label>
      {accion === 'ingresar' && <label className="field">Preventivo relacionado<select name="plan"><option value="">Ingreso sin cita</option>{unidad.taller?.filter(o => o.estado === 'Programado').map(o => <option key={o.at} value={o.at}>{o.fecha} · {o.detalle}</option>)}</select></label>}
      <label className="field">{accion === 'liberar' ? 'Revisión final' : accion === 'trabajo' ? 'Trabajo realizado' : 'Motivo'}<textarea name="notes" maxLength={2000} required /></label>
      {['trabajo','liberar'].includes(accion) && <label className="field">Mecánico<input name="mechanic" required maxLength={100} /></label>}
      {accion === 'trabajo' && <label className="field">Resultado<input name="result" required maxLength={2000} /></label>}
      <button className="button dark" disabled={enCurso}>Guardar movimiento</button>
    </form>}{error && <p role="alert">{error}</p>}
  </section>;
}

export default function FichaUnidad({ unidad, rentas, guardar }) {
  if (!unidad) return <section className="panel"><h1>No encontramos la unidad</h1><Link to="/comercial/inventario">Volver al inventario</Link></section>;
  return <><Link to="/comercial/inventario">Volver al inventario</Link>
    <header className="page-heading"><div><h1>{unidad.id}</h1><p>{unidad.name} · {unidad.model} · {unidad.state}</p><p>Serie {unidad.serial || unidad.id}</p></div></header>
    {guardar && <FormularioTaller unidad={unidad} guardar={guardar} />}
    <section className="panel"><h2>Historial de taller</h2>
      {!unidad.taller?.length && <p>Sin registros de taller</p>}
      {unidad.taller?.slice().reverse().map(o => <article key={o.at}><h3>{o.estado} · {o.fecha}</h3><p>{o.detalle} · {o.by}</p>
        {o.ingreso && <p>Ingreso {o.ingreso.fecha} · {o.ingreso.detalle} · {o.ingreso.by}</p>}
        {o.trabajos.map(t => <p key={t.at}>{t.fecha} · {t.mecanico} · {t.detalle} · {t.resultado}</p>)}
        {o.salida && <p>Salida {o.salida.fecha} · {o.salida.detalle} · {o.salida.mecanico}</p>}</article>)}
    </section><section className="panel"><h2>Rentas de la unidad</h2>
      {!rentas.length && <p>Sin rentas registradas</p>}
      {rentas.map(r => <p key={r.id}><Link to={'/comercial/rentas/' + encodeURIComponent(r.id)}>{r.id} · {r.client} · {r.status}</Link></p>)}</section></>;
}
