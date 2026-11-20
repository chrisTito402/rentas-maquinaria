import { api } from '../api.js';

export const cargarOperacion = () => api.get('/operacion');
export const registrarOperacion = (id, accion, campos) => api.post('/operacion/acciones', { id, accion, campos });
export const asignarReservacion = id => api.post(`/operacion/reservaciones/${id}/asignar`, { automatica: true });
export const registrarUnidad = (equipoId, unidad) => api.post(`/operacion/equipos/${equipoId}/unidades`, { unidad });
