import { createHash } from 'node:crypto';
import { query } from '../db.js';
import { errorHttp } from '../errores.js';

export const nombreCookie = () => process.env.NODE_ENV === 'production' ? '__Host-rentas' : 'rentas-sesion';
export const opcionesCookie = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
export const hashToken = token => createHash('sha256').update(token).digest('hex');
export function leerToken(req) {
  const valor = req.headers.cookie?.split(';').map(c => c.trim()).find(c => c.startsWith(nombreCookie() + '='))?.slice(nombreCookie().length + 1);
  return /^[a-f\d]{64}$/.test(valor || '') ? valor : null;
}
export function comprobarOrigen(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const esperado = process.env.APP_ORIGIN || `${req.protocol}://${req.get('host')}`;
  if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && req.headers.origin !== esperado)) {
    throw errorHttp(403, 'La solicitud no proviene de este sitio.');
  }
  next();
}
export function protegerSesion(consultar = query) {
  return async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const token = leerToken(req);
    if (!token) throw errorHttp(401, 'Inicia sesión para acceder al panel.');
    const { rows } = await consultar(`SELECT u.id, u.usuario_cifrado FROM auth_sesiones s
      JOIN auth_usuarios u ON u.id = s.usuario_id
      WHERE s.token_hash = $1 AND s.vence_en > NOW() AND u.activo = TRUE`, [hashToken(token)]);
    if (!rows.length) throw errorHttp(401, 'Tu sesión terminó. Inicia sesión nuevamente.');
    req.usuario = rows[0];
    next();
  };
}
