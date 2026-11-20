import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import { query } from '../db.js';
import { errorHttp } from '../errores.js';
import { indiceUsuario, descifrarUsuario, hashContrasena, verificarContrasena } from './credenciales.js';
import { comprobarOrigen, protegerSesion, leerToken, hashToken, nombreCookie, opcionesCookie } from './sesion.js';

// La inyección permite verificar el contrato HTTP sin una base productiva.
export function crearRutasAuth(consultar = query) {
  const r = Router();
  let hashFicticio;
  r.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  r.use(comprobarOrigen);
  r.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false,
    message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' } }), async (req, res) => {
    const { usuario, contrasena } = req.body ?? {};
    if (typeof usuario !== 'string' || !usuario.trim() || usuario.length > 100
      || typeof contrasena !== 'string' || !contrasena || contrasena.length > 256) {
      throw errorHttp(400, 'Escribe tu usuario y contraseña.');
    }
    const { rows } = await consultar('SELECT id, usuario_cifrado, contrasena_hash, activo, rol FROM auth_usuarios WHERE usuario_indice = $1', [indiceUsuario(usuario)]);
    const cuenta = rows[0];
    hashFicticio ??= hashContrasena(randomBytes(32).toString('hex'));
    const coincide = await verificarContrasena(cuenta?.contrasena_hash || await hashFicticio, contrasena);
    if (!coincide || !cuenta?.activo) throw errorHttp(401, 'Usuario o contraseña incorrectos.');
    const token = randomBytes(32).toString('hex');
    const vence = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const anterior = leerToken(req);
    if (anterior) await consultar('DELETE FROM auth_sesiones WHERE token_hash = $1', [hashToken(anterior)]);
    await consultar('DELETE FROM auth_sesiones WHERE vence_en <= NOW()');
    const creada = await consultar(`INSERT INTO auth_sesiones (token_hash, usuario_id, vence_en)
      SELECT $1, id, $3 FROM auth_usuarios WHERE id=$2 AND activo AND rol=$4 FOR SHARE RETURNING usuario_id`,
      [hashToken(token), cuenta.id, vence, cuenta.rol]);
    if (!creada.rowCount) throw errorHttp(401, 'Tu cuenta cambió. Vuelve a iniciar sesión.');
    res.cookie(nombreCookie(), token, { ...opcionesCookie(), maxAge: 8 * 60 * 60 * 1000 });
    res.json({ usuario: { id: cuenta.id, nombre: descifrarUsuario(cuenta.usuario_cifrado), rol: cuenta.rol } });
  });
  r.get('/sesion', protegerSesion(consultar), (req, res) => {
    res.json({ usuario: { id: req.usuario.id, nombre: descifrarUsuario(req.usuario.usuario_cifrado), rol: req.usuario.rol } });
  });
  r.post('/logout', async (req, res) => {
    const token = leerToken(req);
    if (token) await consultar('DELETE FROM auth_sesiones WHERE token_hash = $1', [hashToken(token)]);
    res.clearCookie(nombreCookie(), opcionesCookie()).json({ ok: true });
  });
  return r;
}
