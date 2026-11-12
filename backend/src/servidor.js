import { app } from './app.js';
import { prepararBase } from './preparar-base.js';

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV === 'production') await prepararBase();
app.listen(PORT, () => console.log(`Aplicación lista en el puerto ${PORT}`));
