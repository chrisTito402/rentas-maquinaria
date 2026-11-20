// Ambos módulos usan la misma conexión a PostgreSQL.
import express from 'express';
import { fileURLToPath } from 'node:url';
import { query } from './db.js';
import equipos from './rutas/equipos.rutas.js';
import solicitudes from './rutas/solicitudes.rutas.js';
import aprobaciones from './rutas/aprobaciones.rutas.js';
import consultas from './rutas/consultas.rutas.js';
import operacion from './rutas/operacion.rutas.js';
import ocupadas from './rutas/ocupadas.rutas.js';   // HU-02a · Chris
import panel from './rutas/panel.rutas.js';         // HU-05  · Katia
import pdf from './rutas/pdf.rutas.js';             // HU-07  · Héctor
import { crearRutasAuth } from './auth/rutas.js';
import { comprobarOrigen, protegerSesion } from './auth/sesion.js';

export const app = express();
app.disable('x-powered-by');
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
app.use('/api/operacion', comprobarOrigen, protegerSesion(), express.json({ limit: '1200kb' }), operacion);
app.use(express.json());
app.use('/api/auth', crearRutasAuth());

app.get('/api/salud', async (req, res) => {
  await query('SELECT 1');
  res.json({ ok: true });
});

app.use('/api/equipos', ocupadas, equipos);
// /web es pública; todo lo que va después de protegerSesion() pide haber iniciado sesión.
app.use('/api/cotizaciones', solicitudes, comprobarOrigen, protegerSesion(), panel, pdf, aprobaciones, consultas);

// Las rutas de la API nunca deben devolver la página de React.
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
const pagina = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
app.use(express.static(pagina));
app.get(/.*/, (req, res, next) => {
  if (!req.accepts('html')) return next();
  res.sendFile('index.html', { root: pagina }, error => {
    if (error) next(error);
  });
});

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// En Express 5 los errores de las funciones async llegan aquí solos (no hace falta try/catch).
app.use((err, req, res, next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Error del servidor', ...err.extra });
});

