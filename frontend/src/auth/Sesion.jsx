import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api } from '../api.js';

const ContextoSesion = createContext(null);
export const useSesion = () => useContext(ContextoSesion);

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  async function consultar() {
    setCargando(true);
    setError('');
    try { setUsuario((await api.get('/auth/sesion')).usuario); }
    catch (fallo) {
      setUsuario(null);
      if (fallo.status !== 401) setError('No se pudo verificar tu sesión. Revisa tu conexión e intenta de nuevo.');
    } finally { setCargando(false); }
  }
  useEffect(() => {
    consultar();
    const expirada = () => { setUsuario(null); setError(''); };
    window.addEventListener('sesion-expirada', expirada);
    return () => window.removeEventListener('sesion-expirada', expirada);
  }, []);
  async function entrar(usuario, contrasena) {
    const datos = await api.post('/auth/login', { usuario, contrasena });
    setUsuario(datos.usuario);
    setError('');
  }
  async function salir() {
    await api.post('/auth/logout', {});
    setUsuario(null);
  }
  return <ContextoSesion.Provider value={{ usuario, cargando, error, consultar, entrar, salir }}>{children}</ContextoSesion.Provider>;
}

export function RequiereSesion() {
  const sesion = useSesion();
  const ubicacion = useLocation();
  if (sesion.cargando) return <div className="acceso-espera" role="status">Verificando sesión…</div>;
  if (sesion.error) return <div className="acceso-espera"><p role="alert">{sesion.error}</p><button onClick={sesion.consultar}>Reintentar</button></div>;
  if (!sesion.usuario) return <Navigate to="/login" state={{ desde: ubicacion.pathname + ubicacion.search }} replace />;
  return <Outlet />;
}
