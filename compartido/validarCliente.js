// Dueño: Katia · HU-06 Registrar datos del cliente (KAN-12)
import { MUNICIPIOS } from './constantes.js';

const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$/;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Regresa {} si todo está bien, o { campo: 'mensaje', ... } con un error por campo.
export function validarCliente(cliente = {}) {
  const errores = {};
  const nombre = (cliente.nombre ?? '').trim();
  const telefono = (cliente.telefono ?? '').trim();
  const correo = (cliente.correo ?? '').trim();
  const empresa = (cliente.empresa ?? '').trim();
  const direccion = (cliente.direccion ?? '').trim();

  if (!nombre) errores.nombre = 'Escribe tu nombre completo.';
  else if (nombre.length > 150) errores.nombre = 'Máximo 150 caracteres.';
  else if (!SOLO_LETRAS.test(nombre)) errores.nombre = 'Solo letras y espacios.';
  else if (nombre.split(/\s+/).length < 2) errores.nombre = 'Escribe tu nombre y tu apellido.';

  if (!/^[2-9]\d{9}$/.test(telefono)) errores.telefono = 'Deben ser 10 dígitos y no empezar con 0 ni 1.';

  if (!correo) errores.correo = 'Escribe tu correo.';
  else if (correo.length > 100) errores.correo = 'Máximo 100 caracteres.';
  else if (!CORREO.test(correo)) errores.correo = 'Escribe un correo válido, por ejemplo nombre@correo.com.';

  if (empresa.length > 100) errores.empresa = 'Máximo 100 caracteres.';

  if (!MUNICIPIOS.includes(cliente.municipio)) errores.municipio = 'Elige un municipio de la lista.';

  if (!direccion) errores.direccion = 'Escribe calle, número y colonia.';
  else if (direccion.length > 200) errores.direccion = 'Máximo 200 caracteres.';

  return errores;
}
