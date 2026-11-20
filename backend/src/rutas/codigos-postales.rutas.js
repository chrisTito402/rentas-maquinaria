// Dueño: Katia · A4 Código postal (HU-06)
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { query } from '../db.js';
import { errorHttp } from '../errores.js';
import { buscarCodigoPostal, hayCatalogo } from '../codigosPostales.js';

const r = Router();

// La licencia de Correos no permite redistribuir el catálogo: se limita la consulta para que
// no se pueda descargar completo pidiendo un código postal tras otro.
r.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 150, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Demasiadas consultas de códigos postales. Intenta de nuevo en unos minutos.' } }));

// GET /api/codigos-postales/85000  (pública: la usa el formulario del cliente)
// regresa 200: { codigoPostal, municipio, estado, colonias: [...] }
// 400 si no son 5 dígitos · 404 si no existe en Sonora · 503 si todavía no se carga el catálogo
r.get('/:codigoPostal', async (req, res) => {
  const { codigoPostal } = req.params;
  if (!/^\d{5}$/.test(codigoPostal)) throw errorHttp(400, 'El código postal debe tener 5 dígitos.');
  const db = { query };
  if (!(await hayCatalogo(db))) throw errorHttp(503, 'El catálogo de códigos postales no está cargado.');
  const info = await buscarCodigoPostal(db, codigoPostal);
  if (!info) throw errorHttp(404, 'No encontramos ese código postal en Sonora.');
  res.json(info);
});

export default r;
