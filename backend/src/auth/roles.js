// Roles del personal comercial (notas de la re-presentación del Sprint 1: seguridad por roles).
// admin: todo lo del panel, incluido aprobar y rechazar cotizaciones.
// auxiliar: consulta y captura cotizaciones, pero no las aprueba ni las rechaza.
import { errorHttp } from '../errores.js';

import { perfiles, puedeOperar, puedeCapturarCotizacion } from '../../../compartido/perfiles.js';

export const ROLES = Object.keys(perfiles);

export function soloOperaciones(req, res, next) {
  if (!puedeOperar(req.usuario?.rol)) throw errorHttp(403, 'Tu perfil solo puede consultar operaciones.');
  next();
}

export function accesoComercial(req, res, next) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !puedeCapturarCotizacion(req.usuario?.rol)) {
    throw errorHttp(403, 'Tu perfil solo puede consultar cotizaciones.');
  }
  next();
}

// Se usa después de protegerSesion(), que deja el rol en req.usuario.
export function soloAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') throw errorHttp(403, 'Solo el administrador puede hacer esta acción.');
  next();
}
