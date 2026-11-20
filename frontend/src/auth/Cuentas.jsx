import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { perfiles } from '@compartido/perfiles.js';
import { api } from '../api.js';
import { useSesion } from './Sesion.jsx';

function Opciones() {
  return Object.entries(perfiles).map(([rol, nombre]) => <option key={rol} value={rol}>{nombre}</option>);
}

function Fila({ cuenta, propia, guardar, ocupado }) {
  const [rol, setRol] = useState(cuenta.rol);
  const [activo, setActivo] = useState(cuenta.activo);
  return <tr><th scope="row">{cuenta.nombre}</th>
    <td><select aria-label={'Perfil de ' + cuenta.nombre} disabled={propia || ocupado} value={rol} onChange={e => setRol(e.target.value)}><Opciones /></select></td>
    <td><label className="cuenta-habilitada"><input type="checkbox" disabled={propia || ocupado} checked={activo} onChange={e => setActivo(e.target.checked)} /> Habilitada</label></td>
    <td>{propia ? 'Tu cuenta' : <button type="button" className="button soft" disabled={ocupado || (rol === cuenta.rol && activo === cuenta.activo)} onClick={() => guardar(cuenta.id, { rol, activo })}>Guardar</button>}</td></tr>;
}

export default function Cuentas() {
  const { usuario } = useSesion();
  const [cuentas, setCuentas] = useState([]);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    if (usuario.rol !== 'admin') return;
    let vigente = true;
    api.get('/cuentas').then(filas => { if (vigente) setCuentas(filas); }, fallo => { if (vigente) setError(fallo.message); });
    return () => { vigente = false; };
  }, [usuario.rol, intento]);
  if (usuario.rol !== 'admin') return <Navigate to="/comercial/inicio" replace />;
  async function guardar(id, datos, form) {
    setError(''); setAviso(''); setOcupado(true);
    try {
      if (id) {
        const cambio = await api.patch('/cuentas/' + id, datos);
        setCuentas(actual => actual.map(c => c.id === id ? { ...c, ...cambio } : c));
      } else {
        const cuenta = await api.post('/cuentas', datos);
        setCuentas(actual => [...actual, cuenta]);
        form.reset();
      }
      setAviso(id ? 'Cambios guardados' : 'Cuenta creada');
    } catch (fallo) { setError(fallo.message); }
    finally { setOcupado(false); }
  }
  return <section className="panel"><h1>Cuentas del equipo</h1>
    <form className="list-toolbar" onSubmit={e => { e.preventDefault(); const f = e.currentTarget; void guardar(null, Object.fromEntries(new FormData(f)), f); }}>
      <label>Usuario<input name="nombre" required maxLength={100} autoComplete="off" /></label>
      <label>Contraseña inicial<input name="contrasena" type="password" autoComplete="new-password" minLength={12} maxLength={256} required /></label>
      <label>Perfil<select name="rol" defaultValue="consulta"><Opciones /></select></label>
      <button type="submit" className="button dark" disabled={ocupado}>Crear cuenta</button>
    </form>
    {error && <p role="alert">{error} <button type="button" onClick={() => { setError(''); setIntento(n => n + 1); }}>Volver a cargar cuentas</button></p>}
    {aviso && <p role="status">{aviso}</p>}
    <div className="table-scroll"><table className="gestion-table"><thead><tr><th>Usuario</th><th>Perfil</th><th>Acceso</th><th>Cambios</th></tr></thead>
    <tbody>{cuentas.map(c => <Fila key={c.id + ':' + c.rol + ':' + c.activo} cuenta={c} propia={c.id === usuario.id} guardar={guardar} ocupado={ocupado} />)}</tbody></table></div>
  </section>;
}
