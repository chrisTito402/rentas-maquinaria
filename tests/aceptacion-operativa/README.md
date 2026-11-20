# Presentación de pruebas de Operativa

Esta carpeta reúne **15 escenarios de aceptación**: siete de reglas de negocio y
ocho de pantalla. Cada identificador OP-01 a OP-15 representa un escenario, aunque
incluya varias comprobaciones. La exploración complementa estos casos; sus nueve
sondeos no se cuentan como pruebas adicionales de aceptación.

## Documentos para presentar

1. [Documento de pruebas](DOCUMENTO.md): selección, justificación, pasos, resultados
   esperados y retroalimentación útil por escenario.
2. [Guía exploratoria](EXPLORACION.md): preguntas abiertas, sesiones propuestas y
   registro de observaciones reproducibles.
3. [Resultados de la ejecución](RESULTADOS.md): resultados reales, hallazgos,
   evidencias y límites de lo comprobado.

## Ejecutar todo el paquete

Desde la raíz del repositorio, con las dependencias instaladas:

```sh
npm ci --prefix backend
npm ci --prefix frontend
npm run test:aceptacion --prefix frontend
```

En PowerShell, usa `npm.cmd` si la política de scripts bloquea `npm.ps1`. Playwright
usa Microsoft Edge, igual que la configuración existente; si falta, instala Edge
antes de ejecutar. El runner arranca Vite automáticamente o reutiliza el servidor
local en `127.0.0.1:5173`. No requiere servidor Express, cuenta ni base de datos:
las pantallas interceptan la API y simulan una sesión válida de personal.

El comando ejecuta primero las siete reglas con Node, después los ocho casos de
pantalla y finalmente los sondeos exploratorios. Su código de salida es distinto
de cero si falla una ejecución; un hallazgo exploratorio documentado no se
interpreta automáticamente como fallo de los casos de aceptación.

Para repetir una parte:

```sh
node --test tests/aceptacion-operativa/reglas.test.mjs
node --test --test-name-pattern=OP-11 tests/aceptacion-operativa/reglas.test.mjs
node tests/aceptacion-operativa/explorar.mjs
```

Desde `frontend`:

```sh
npx playwright test --config playwright.aceptacion.config.js
npx playwright test --config playwright.aceptacion.config.js --grep OP-09
npx playwright show-report ../tests/aceptacion-operativa/resultados/reporte-html
```

## Evidencias y organización

- `reglas.test.mjs`: OP-02 a OP-07 y OP-11, sin DOM ni almacenamiento.
- `pantallas.spec.js`: OP-01, OP-08 a OP-10 y OP-12 a OP-15.
- `soporte/`: datos de ejemplo y respuestas de la API simulada compartidas con la
  regresión. `frontend/pruebas-navegador.js` reutiliza la instalación de Playwright.
- `resultados/`: salida de Node, informe JSON/HTML de Playwright, capturas por caso,
  trazas de fallos, exploración JSON y fechas de ejecución. Se genera localmente y
  se excluye de Git para no versionar reportes temporales.
- `evidencias/`: capturas seleccionadas de la ejecución documentada para presentar.

Las pruebas originales se reorganizaron sin mantener copias paralelas de los casos
seleccionados. `tests/flujo.test.mjs` importa las reglas agrupadas para conservar
`npm test --prefix frontend`. El comando `test:e2e` ejecuta la regresión restante
y este paquete de pantallas. El mantenimiento en pantalla, la recuperación de
carga y el login siguen fuera de los 15 como cobertura adicional.

## Qué permite concluir

Las reglas usan funciones reales y las pantallas usan React real con respuestas
simuladas. La recarga confirma que la interfaz recupera lo que devuelve esa API;
**no demuestra persistencia en PostgreSQL, concurrencia, permisos reales ni un
despliegue correcto en Render**. La impresión comprueba el documento en modo print,
no una impresora física. La vista móvil usa 390 × 844 en Edge de escritorio, no un
teléfono real. Las pruebas de autenticación permanecen en `tests/auth.test.mjs` y
`frontend/tests/login.spec.js`, fuera de la selección operativa.
