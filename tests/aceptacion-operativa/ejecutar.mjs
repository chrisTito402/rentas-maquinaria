import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const raiz = fileURLToPath(new URL('../../', import.meta.url));
const carpeta = fileURLToPath(new URL('./', import.meta.url));
const frontend = fileURLToPath(new URL('../../frontend/', import.meta.url));
const requireFrontend = createRequire(new URL('../../frontend/package.json', import.meta.url));
const cli = requireFrontend.resolve('@playwright/test/cli');
mkdirSync(new URL('./resultados/', import.meta.url), { recursive: true });

function ejecutar(nombre, argumentos, cwd) {
  const resultado = spawnSync(process.execPath, argumentos, { cwd, encoding: 'utf8', timeout: 180000 });
  const salida = (resultado.stdout || '') + (resultado.stderr || '');
  process.stdout.write(salida);
  writeFileSync(new URL(`./resultados/${nombre}.txt`, import.meta.url), salida);
  return { codigo: resultado.status ?? 1, error: resultado.error?.message };
}

const inicio = new Date().toISOString();
const reglas = ejecutar('reglas', ['--test', '--test-reporter=spec', `${carpeta}reglas.test.mjs`], raiz);
const pantallas = ejecutar('pantallas', [cli, 'test', '--config', 'playwright.aceptacion.config.js'], frontend);
const exploracion = ejecutar('exploracion', [`${carpeta}explorar.mjs`], raiz);
const fin = new Date().toISOString();
writeFileSync(new URL('./resultados/ejecucion.json', import.meta.url), JSON.stringify({
  inicio, fin, zonaHoraria: 'America/Hermosillo', node: process.version,
  entorno: 'Lógica real en memoria y navegador con API simulada; sin PostgreSQL ni Render',
  reglas, pantallas, exploracion,
}, null, 2));
process.exitCode = reglas.codigo || pantallas.codigo || exploracion.codigo;
