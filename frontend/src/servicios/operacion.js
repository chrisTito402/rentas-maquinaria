import { api } from '../api.js';

export const cargarOperacion = () => api.get('/operacion');
export const registrarOperacion = (id, accion, campos) => api.post('/operacion/acciones', { id, accion, campos });
export const reiniciarOperacion = () => api.post('/operacion/reiniciar', { confirmar: true });
