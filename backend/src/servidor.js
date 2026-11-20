import { readFile } from 'node:fs/promises';
import { app } from './app.js';
import { query } from './db.js';
import { prepararBase } from './preparar-base.js';
import { validarConfiguracionAuth } from './auth/credenciales.js';

const PORT = process.env.PORT || 3001;
validarConfiguracionAuth();
if (process.env.NODE_ENV === 'production') await prepararBase();
else {
  // En local también se aplica auth.sql (solo agrega lo que falta, como la columna rol),
  // para que el login no falle en las bases que se crearon antes de los roles.
  try { await query(await readFile(new URL('../db/auth.sql', import.meta.url), 'utf8')); }
  catch (error) { console.warn('No se pudo preparar la tabla de usuarios:', error.message); }
}
app.listen(PORT, () => console.log(`Aplicación lista en el puerto ${PORT}`));
