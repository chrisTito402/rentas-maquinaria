import { app } from './app.js';
import { prepararBase } from './preparar-base.js';
import { validarConfiguracionAuth } from './auth/credenciales.js';
import { iniciarVigencia } from './vigencia.js';

const PORT = process.env.PORT || 3001;
validarConfiguracionAuth();
if (process.env.NODE_ENV === 'production') await prepararBase();
else {
  // En local también se agregan las tablas y columnas que falten (arranque.sql y auth.sql),
  // como la columna rol o el código postal del cliente. No borra datos.
  try { await prepararBase(); }
  catch (error) { console.warn('No se pudo preparar la base:', error.message); }
}
iniciarVigencia();   // A1: las cotizaciones vencen a los 15 días
app.listen(PORT, () => console.log(`Aplicación lista en el puerto ${PORT}`));
