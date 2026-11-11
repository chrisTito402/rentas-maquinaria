import { Router } from 'express';
import { errorHttp } from '../errores.js';
import { cargarOperacion, crearApartado, registrarOperacion, registrarUnidad } from '../operacion.js';

const r = Router();
const esObjeto = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const fechaValida = value => /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

r.get('/', async (req, res) => {
  res.set('Cache-Control', 'no-store').json(await cargarOperacion());
});

r.post('/acciones', async (req, res) => {
  const { id, accion, campos } = req.body ?? {};
  if (typeof id !== 'string' || typeof accion !== 'string' || !esObjeto(campos)
    || Object.entries(campos).some(([clave, valor]) => {
      if (clave === 'inventory') return !Array.isArray(valor) || valor.some(item => typeof item !== 'string');
      return typeof valor !== 'string' || (clave === 'date' && !fechaValida(valor));
    })) {
    throw errorHttp(400, 'La renta, la acción o los datos del formulario no son válidos.');
  }
  res.json(await registrarOperacion(id, accion, campos));
});

r.post('/reservaciones/:id/asignar', async (req, res) => {
  const id = Number(req.params.id);
  const unidades = req.body?.unidades;
  if (!Number.isInteger(id) || id < 1 || id > 2147483647
    || !Array.isArray(unidades) || unidades.some(unidad => typeof unidad !== 'string')) {
    throw errorHttp(400, 'La cotización o los identificadores no son válidos.');
  }
  res.json(await crearApartado(id, unidades));
});

r.post('/equipos/:id/unidades', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1 || id > 2147483647 || typeof req.body?.unidad !== 'string') {
    throw errorHttp(400, 'El modelo o el identificador no es válido.');
  }
  res.json(await registrarUnidad(id, req.body.unidad));
});

export default r;
