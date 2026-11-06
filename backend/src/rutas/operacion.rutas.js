import { Router } from 'express';
import { errorHttp } from '../errores.js';
import { cargarOperacion, registrarOperacion, reiniciarOperacion } from '../operacion.js';

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

r.post('/reiniciar', async (req, res) => {
  if (req.body?.confirmar !== true) throw errorHttp(400, 'Confirma el reinicio de la demostración.');
  res.json(await reiniciarOperacion());
});

export default r;
