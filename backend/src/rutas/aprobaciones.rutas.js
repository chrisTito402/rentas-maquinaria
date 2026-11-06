// Dueño: Héctor · HU-15a Aprobar cotización (KAN-15)
// VERSIÓN FALSA. Héctor la reemplaza por la real.
import { Router } from 'express';
import { errorHttp } from '../errores.js';

const r = Router();

// PATCH /api/cotizaciones/:id/aprobar
// regresa 200: { id, folio, estado: 'Aprobada' }   ·   404 si no existe   ·   409 si no está Pendiente
r.patch('/:id/aprobar', () => {
  throw errorHttp(501, 'HU-15a: pendiente de programar (Héctor)');
});

export default r;
