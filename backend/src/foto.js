import sharp from 'sharp';
import { errorHttp } from './errores.js';

export async function validarFoto(valor) {
  const mensaje = 'Elige una foto que se pueda abrir en formato JPG, PNG o WebP.';
  if (typeof valor !== 'string' || valor.length > 1100000) throw errorHttp(400, mensaje);
  const partes = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(valor);
  if (!partes) throw errorHttp(400, mensaje);
  try {
    const imagen = sharp(Buffer.from(partes[2], 'base64'), { limitInputPixels: 16000000, failOn: 'warning' });
    const datos = await imagen.metadata();
    if (datos.format !== partes[1] || (datos.pages ?? 1) !== 1) throw new Error();
    await imagen.stats();
  } catch { throw errorHttp(400, mensaje); }
}
