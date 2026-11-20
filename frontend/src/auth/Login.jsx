import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useSesion } from './Sesion.jsx';
import './login.css';

export default function Login() {
  const sesion = useSesion();
  const location = useLocation();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [visible, setVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const desde = location.state?.desde;
  const destino = typeof desde === 'string' && /^\/comercial(?:\/|\?|$)/.test(desde) ? desde : '/comercial/inicio';
  if (!sesion.cargando && sesion.usuario) return <Navigate to={destino} replace />;
  async function enviar(event) {
    event.preventDefault();
    if (guardando) return;
    setError('');
    setGuardando(true);
    try { await sesion.entrar(usuario, contrasena); setContrasena(''); }
    catch (fallo) {
      setError(fallo.status === 401 || fallo.status === 400 || fallo.status === 429
        ? fallo.message : 'No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally { setGuardando(false); }
  }
  return <div className="acceso">
    <header className="acceso-header"><Link to="/" className="acceso-brand"><img src="/img/iconos/logo.svg" alt="" /><div><strong>Renta de Maquinaria</strong><span>Cd. Obregón, Sonora</span></div></Link></header>
    <main className="acceso-main">
      <section className="acceso-login" aria-labelledby="login-title">
        <h1 id="login-title">Iniciar sesión</h1>
        <p className="acceso-intro">Ingresa con tu cuenta para acceder al panel de Comercial y Operaciones.</p>
        <form onSubmit={enviar} aria-busy={guardando}>
          <div className="acceso-field"><label htmlFor="username">Usuario</label><input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Escribe tu usuario" maxLength={100} value={usuario} onChange={e => setUsuario(e.target.value)} required /></div>
          <div className="acceso-field"><label htmlFor="password">Contraseña</label><div className="acceso-password"><input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Escribe tu contraseña" maxLength={256} value={contrasena} onChange={e => setContrasena(e.target.value)} required /><button className="acceso-show" type="button" aria-controls="password" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Ocultar' : 'Mostrar'}</button></div></div>
          {error && <p className="acceso-error" role="alert">{error}</p>}
          <button className="acceso-submit" type="submit" disabled={guardando || sesion.cargando}>{guardando ? 'Iniciando sesión…' : 'Iniciar sesión'}</button>
        </form>
        {/* Ajuste A5: dejar claro a qué catálogo regresa */}
        <Link to="/" className="acceso-back">← Ver catálogo de maquinaria en renta</Link>
      </section>
    </main>
    <footer className="acceso-footer">Renta de Maquinaria · Cd. Obregón, Sonora</footer>
  </div>;
}
