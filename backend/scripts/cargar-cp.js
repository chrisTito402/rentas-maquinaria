// Dueño: Katia · A4 Carga los códigos postales de Sonora en la tabla codigos_postales.
// Uso:  npm run cp:cargar --prefix backend
//       Descarga el archivo directo de Correos de México (tarda ~1 minuto: su página es lenta).
//       Si la página no responde, descárgalo a mano y usa:  CP_ARCHIVO=C:\ruta\Sonora.txt
// El archivo NO se guarda en el repo: su licencia dice que es para uso particular y no permite
// distribuirlo. La app solo responde un código postal a la vez.
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { pool } from '../src/db.js';
import { prepararBase } from '../src/preparar-base.js';

const URL_CORREOS = 'https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/CodigoPostal_Exportar.aspx';
const SONORA = '26';
const ESPERA_MS = 120_000;
const INTENTOS = 3;

const campoOculto = (html, nombre) => html.match(new RegExp(`id="${nombre}" value="([^"]*)"`))?.[1] ?? '';

async function descargarDeCorreos() {
  // La página es un formulario de ASP.NET: primero se pide para obtener sus campos ocultos y la cookie,
  // y luego se "envía" eligiendo Sonora y el formato TXT, igual que al darle Descargar en el navegador.
  const pagina = await fetch(URL_CORREOS, { signal: AbortSignal.timeout(ESPERA_MS) });
  const html = await pagina.text();
  const cookie = (pagina.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
  const formulario = new URLSearchParams({
    __EVENTTARGET: '', __EVENTARGUMENT: '', __LASTFOCUS: '',
    __VIEWSTATE: campoOculto(html, '__VIEWSTATE'),
    __VIEWSTATEGENERATOR: campoOculto(html, '__VIEWSTATEGENERATOR'),
    __EVENTVALIDATION: campoOculto(html, '__EVENTVALIDATION'),
    cboEdo: SONORA, rblTipo: 'txt', 'btnDescarga.x': '10', 'btnDescarga.y': '10',
  });
  const respuesta = await fetch(URL_CORREOS, {
    method: 'POST', body: formulario, signal: AbortSignal.timeout(ESPERA_MS),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookie },
  });
  if (!respuesta.ok) throw new Error(`Correos respondió ${respuesta.status}`);
  return Buffer.from(await respuesta.arrayBuffer());
}

async function obtenerArchivo() {
  if (process.env.CP_ARCHIVO) {
    console.log(`Leyendo ${process.env.CP_ARCHIVO}…`);
    return readFile(process.env.CP_ARCHIVO);
  }
  for (let intento = 1; intento <= INTENTOS; intento += 1) {
    try {
      console.log(`Descargando Sonora de Correos de México (intento ${intento} de ${INTENTOS})…`);
      return await descargarDeCorreos();
    } catch (error) {
      console.warn(`  No se pudo: ${error.message}`);
    }
  }
  throw new Error('La página de Correos no respondió. Descarga Sonora en TXT desde\n'
    + `  ${URL_CORREOS}\n  y corre de nuevo con CP_ARCHIVO=ruta\\Sonora.txt`);
}

// El TXT viene en latin1, separado por "|": 1ª línea = aviso, 2ª = nombres de columnas.
function leerFilas(archivo) {
  const lineas = archivo.toString('latin1').split(/\r?\n/);
  if (!lineas[1]?.startsWith('d_codigo|')) throw new Error('El archivo no tiene el formato del catálogo de Correos.');
  const filas = [];
  for (const linea of lineas.slice(2)) {
    const c = linea.split('|');
    if (/^\d{5}$/.test(c[0]) && c[1] && c[3] && c[4]) filas.push({ cp: c[0], colonia: c[1].trim(), municipio: c[3].trim(), estado: c[4].trim() });
  }
  return filas;
}

try {
  const filas = leerFilas(await obtenerArchivo());
  if (filas.length < 1000) throw new Error(`Solo se leyeron ${filas.length} renglones; el archivo parece incompleto.`);
  await prepararBase();   // crea la tabla si falta
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    await db.query("DELETE FROM codigos_postales WHERE estado = 'Sonora'");
    await db.query(
      `INSERT INTO codigos_postales (codigo_postal, colonia, municipio, estado)
       SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[])`,
      [filas.map((f) => f.cp), filas.map((f) => f.colonia), filas.map((f) => f.municipio), filas.map((f) => f.estado)],
    );
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    db.release();
  }
  console.log(`Listo: ${filas.length} colonias y ${new Set(filas.map((f) => f.cp)).size} códigos postales de Sonora.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
