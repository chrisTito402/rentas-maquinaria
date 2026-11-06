// BASE · No se toca. Así se llama al backend:
//   const equipos = await api.get('/equipos');
//   const r = await api.post('/cotizaciones/web', { ... });
// Si el backend responde error, lanza un Error con .message (texto del backend), .status y .datos.
async function pedir(metodo, url, cuerpo) {
  const resp = await fetch('/api' + url, {
    method: metodo,
    headers: cuerpo ? { 'Content-Type': 'application/json' } : undefined,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const error = new Error(datos.error || 'No se pudo conectar con el servidor');
    error.status = resp.status;
    error.datos = datos;
    throw error;
  }
  return datos;
}

export const api = {
  get: (url) => pedir('GET', url),
  post: (url, cuerpo) => pedir('POST', url, cuerpo),
  patch: (url, cuerpo) => pedir('PATCH', url, cuerpo ?? {}),
};
