// Permite que las pruebas importen archivos del frontend que usan el alias @compartido de Vite.
import { register } from 'node:module';

const carpeta = new URL('../compartido/', import.meta.url).href;
const hook = `export async function resolve(especificador, contexto, siguiente) {
  if (especificador.startsWith('@compartido/')) especificador = ${JSON.stringify(carpeta)} + especificador.slice(12);
  return siguiente(especificador, contexto);
}`;
register('data:text/javascript,' + encodeURIComponent(hook));
