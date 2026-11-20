import { readFile } from 'node:fs/promises';
import { pool } from '../src/db.js';
import { cifrarUsuario, indiceUsuario, hashContrasena, normalizarUsuario } from '../src/auth/credenciales.js';
import { ROLES } from '../src/auth/roles.js';

// Credenciales por variables de entorno; nunca por argumentos o salida del comando.
const usuario = process.env.AUTH_USUARIO;
const contrasena = process.env.AUTH_CONTRASENA;
const rol = process.env.AUTH_ROL || 'auxiliar';   // las cuentas nuevas empiezan con el mínimo acceso
try {
  if (!usuario?.trim() || usuario.length > 100 || !contrasena || contrasena.length < 12 || contrasena.length > 256) {
    throw new Error('Configura AUTH_USUARIO (hasta 100 caracteres) y AUTH_CONTRASENA (12 a 256 caracteres).');
  }
  if (!ROLES.includes(rol)) throw new Error(`AUTH_ROL debe ser ${ROLES.join(' o ')}.`);
  const cifrado = cifrarUsuario(normalizarUsuario(usuario));
  const hash = await hashContrasena(contrasena);
  await pool.query(await readFile(new URL('../db/auth.sql', import.meta.url), 'utf8'));
  await pool.query('INSERT INTO auth_usuarios (usuario_cifrado, usuario_indice, contrasena_hash, rol) VALUES ($1, $2, $3, $4)',
    [cifrado, indiceUsuario(usuario), hash, rol]);
  console.log(`Cuenta interna creada (${rol}).`);
} catch (error) {
  console.error(error.code === '23505' ? 'La cuenta ya existe.' : error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
