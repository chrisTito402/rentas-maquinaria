import { Router } from 'express';
import { pool, query } from '../db.js';
import { errorHttp } from '../errores.js';
import { cifrarUsuario, descifrarUsuario, hashContrasena, indiceUsuario } from './credenciales.js';
import { ROLES } from './roles.js';

const rutas = Router();
const publica = cuenta => ({
  id: cuenta.id, nombre: descifrarUsuario(cuenta.usuario_cifrado), rol: cuenta.rol, activo: cuenta.activo,
});

rutas.get('/', async (req, res) => {
  const { rows } = await query('SELECT id, usuario_cifrado, rol, activo FROM auth_usuarios ORDER BY id');
  res.json(rows.map(publica));
});

rutas.post('/', async (req, res) => {
  const { nombre, contrasena, rol } = req.body ?? {};
  if (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 100 ||
      typeof contrasena !== 'string' || contrasena.length < 12 || contrasena.length > 256 || !ROLES.includes(rol)) {
    throw errorHttp(400, 'Escribe un usuario, elige un perfil y usa una contraseña de 12 a 256 caracteres.');
  }
  const { rows } = await query(
    'INSERT INTO auth_usuarios (usuario_cifrado, usuario_indice, contrasena_hash, rol) VALUES ($1,$2,$3,$4) ON CONFLICT (usuario_indice) DO NOTHING RETURNING id, usuario_cifrado, rol, activo',
    [cifrarUsuario(nombre), indiceUsuario(nombre), await hashContrasena(contrasena), rol]);
  if (!rows.length) throw errorHttp(409, 'Ese usuario ya existe.');
  res.status(201).json(publica(rows[0]));
});

rutas.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rol, activo } = req.body ?? {};
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647 || !ROLES.includes(rol) || typeof activo !== 'boolean') {
    throw errorHttp(400, 'Revisa la cuenta, su perfil y su estado.');
  }
  if (id === req.usuario.id) throw errorHttp(409, 'Otra persona con perfil administrador debe cambiar tu cuenta.');
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    // Revalidar después de tomar el bloqueo evita que dos administradores se desactiven mutuamente.
    await db.query('LOCK TABLE auth_usuarios IN SHARE ROW EXCLUSIVE MODE');
    const actor = await db.query("SELECT id FROM auth_usuarios WHERE id=$1 AND activo AND rol='admin'", [req.usuario.id]);
    if (!actor.rowCount) throw errorHttp(403, 'Tu cuenta ya no puede administrar usuarios.');
    const actual = await db.query('SELECT rol, activo FROM auth_usuarios WHERE id=$1', [id]);
    if (!actual.rowCount) throw errorHttp(404, 'Esa cuenta ya no existe.');
    if (actual.rows[0].rol !== rol || actual.rows[0].activo !== activo) {
      await db.query('UPDATE auth_usuarios SET rol=$1, activo=$2 WHERE id=$3', [rol, activo, id]);
      await db.query('DELETE FROM auth_sesiones WHERE usuario_id=$1', [id]);
    }
    await db.query('COMMIT');
    res.json({ id, activo, rol });
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally { db.release(); }
});

export default rutas;
