import { randomBytes, createCipheriv, createDecipheriv, createHmac, hkdfSync } from 'node:crypto';
import argon2 from 'argon2';

function clave(proposito) {
  const secreta = process.env.AUTH_KEY;
  if (!/^[a-f\d]{64}$/i.test(secreta || '')) throw new Error('Configura AUTH_KEY con 32 bytes aleatorios en hexadecimal.');
  return Buffer.from(hkdfSync('sha256', Buffer.from(secreta, 'hex'), Buffer.alloc(0), proposito, 32));
}

export function validarConfiguracionAuth() { clave('cifrado'); }
export const normalizarUsuario = usuario => usuario.trim().toLowerCase();
export const indiceUsuario = usuario => createHmac('sha256', clave('indice')).update(normalizarUsuario(usuario)).digest('hex');
export function cifrarUsuario(usuario) {
  const iv = randomBytes(12);
  const cifrador = createCipheriv('aes-256-gcm', clave('cifrado'), iv);
  const datos = Buffer.concat([cifrador.update(normalizarUsuario(usuario), 'utf8'), cifrador.final()]);
  return [iv, cifrador.getAuthTag(), datos].map(valor => valor.toString('base64url')).join('.');
}
export function descifrarUsuario(valor) {
  const [iv, tag, datos] = valor.split('.').map(parte => Buffer.from(parte, 'base64url'));
  const descifrador = createDecipheriv('aes-256-gcm', clave('cifrado'), iv);
  descifrador.setAuthTag(tag);
  return Buffer.concat([descifrador.update(datos), descifrador.final()]).toString('utf8');
}
export const hashContrasena = contrasena => argon2.hash(contrasena, {
  type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1,
});
export const verificarContrasena = (hash, contrasena) => argon2.verify(hash, contrasena);
