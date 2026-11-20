// Roles del personal comercial (notas de la re-presentación del Sprint 1: seguridad por roles).
// admin: todo lo del panel, incluido aprobar y rechazar cotizaciones.
// auxiliar: consulta y captura cotizaciones, pero no las aprueba ni las rechaza.
import { errorHttp } from '../errores.js';

export const ROLES = ['admin', 'auxiliar'];

// Se usa después de protegerSesion(), que deja el rol en req.usuario.
export function soloAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') throw errorHttp(403, 'Solo el administrador puede hacer esta acción.');
  next();
}
