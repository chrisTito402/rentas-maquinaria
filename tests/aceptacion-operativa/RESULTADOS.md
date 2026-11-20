# Resultados y retroalimentación de Operativa

Corte original del 19 de noviembre. La [verificación del 20 de noviembre](evidencias/cierre/README.md) reúne las correcciones y las pruebas posteriores.

## Ejecución documentada

**Fecha local:** 19 de noviembre de 2026, 21:33:39–21:33:50, America/Hermosillo.
**Base de código:** `ff45e2a` más cambios locales del login y agrupación de pruebas,
todavía sin commit. **Entorno:** Windows, Node v24.20.0, Microsoft Edge headless
mediante Playwright y Vite local. **Comando:** `npm run test:aceptacion --prefix frontend`.

**Resultado automático: 15 de 15 escenarios aprobados**, sin omisiones: siete de
lógica y ocho de pantalla. Los ocho de pantalla terminaron sin reintentos ni fallos
intermitentes. También se ejecutaron nueve sondeos exploratorios de lógica y se
revisaron dos capturas visualmente. La aprobación automática no significa aceptación
final por usuarios ni validación de PostgreSQL o Render.

| ID | Comprobación principal | Resultado automático | Evidencia |
|---|---|---|---|
| OP-01 | Aprobación y asignación sin avance automático | Aprobado | [Captura](evidencias/OP-01.png) |
| OP-02 | Cantidad, cliente y folio de las unidades | Aprobado | [Salida de reglas](evidencias/reglas.txt) |
| OP-03 | Unidades independientes y entrada inmutable | Aprobado | [Salida de reglas](evidencias/reglas.txt) |
| OP-04 | Una sola etapa por renta | Aprobado | [Salida de reglas](evidencias/reglas.txt) |
| OP-05 | Entrega bloqueada antes de preparación lista | Aprobado | [Salida de reglas](evidencias/reglas.txt) |
| OP-06 | Preparar habilita, sin efectuar entrega | Aprobado | [Salida de reglas](evidencias/reglas.txt) |
| OP-07 | Mantenimiento y reanudación de preparación | Aprobado | [Salida de reglas](evidencias/reglas.txt) |
| OP-08 | Generación, datos y visibilidad de responsiva | Aprobado; observación visual H-03 | [Impresión](evidencias/OP-08-impresion.png), [pantalla](evidencias/OP-08.png) |
| OP-09 | Foto válida recuperada al recargar | Aprobado | [Captura](evidencias/OP-09.png) |
| OP-10 | Renta/unidad En renta y detalle tras recarga | Aprobado | [Captura](evidencias/OP-10.png) |
| OP-11 | Rechazo de devolución anterior y aceptación el mismo día | Aprobado | [Salida de reglas](evidencias/reglas.txt) |
| OP-12 | Devolución, cierre, inventario, eventos e historial | Aprobado | [Captura](evidencias/OP-12.png) |
| OP-13 | Error conserva datos y segundo intento guarda | Aprobado | [Captura](evidencias/OP-13.png) |
| OP-14 | Enlaces anteriores y navegación móvil | Aprobado; observación visual H-04 | [Captura móvil](evidencias/OP-14.png) |
| OP-15 | Fecha y foco con teclado; cierre de ventanas | Aprobado | [Captura móvil](evidencias/OP-15.png) |

La captura de OP-13 muestra el estado después del reintento exitoso; las aserciones
del código y el reporte verifican el error previo y la conservación de campos.
OP-15 termina con el formulario cerrado; el código verifica el recorrido del foco.
Una captura final aislada no prueba todos los pasos de un escenario.

## Retroalimentación útil y hallazgos

Los resultados aportan evidencia positiva de que la lógica bloquea entregas prematuras,
mantiene independientes las unidades, respeta el límite de fecha de devolución y
conserva el recorrido al cerrar. Las pantallas permiten continuar después de un
error de guardado y recuperar un detalle al recargar una respuesta simulada.

La exploración detectó cuatro puntos para seguimiento:

| Hallazgo | Evidencia observada | Impacto y recomendación |
|---|---|---|
| H-01 · Imagen declarada PNG pero ilegible | EXP-07 guarda `data:image/png;base64,YQ==` | Puede aceptarse evidencia inválida en la lógica. Validar/decodificar contenido en servidor y probar por HTTP real |
| H-02 · Eventos sin autor autenticado | EXP-09 devuelve siempre `Administrador` | No permite atribuir cambios a una cuenta. Pasar identidad de sesión desde servidor a la lógica |
| H-03 · Panel incluido en impresión | OP-08-impresion.png muestra menú y controles antes de la responsiva | Consume papel y mezcla la pantalla con el documento. Ajustar CSS de impresión y fortalecer su prueba |
| H-04 · Perfil sin separación visual | OP-14.png muestra el botón junto a `Personal interno` | Reduce claridad de cierre de sesión. Ajustar especificidad del estilo del perfil y revisar en dos tamaños |

Son observaciones reproducibles, **no correcciones realizadas**. H-01 y H-02 se
observaron con funciones reales en memoria; H-03 y H-04 mediante revisión de las
capturas. Los pasos completos están en [EXPLORACION.md](EXPLORACION.md).
H-01 no implica que la interfaz haya permitido subir ese archivo: se omitió la
interfaz para explorar la defensa de la lógica que usa el servidor.

## Comprobación adicional de regresión

También se ejecutaron los comandos de regresión durante esta entrega:

| Comprobación | Resultado real |
|---|---|
| `npm test --prefix backend` | 11 aprobadas, 3 omitidas por falta de PostgreSQL |
| `npm test --prefix frontend` | 25 aprobadas; incluye las siete reglas de esta selección |
| Playwright con `playwright.config.js` | 4 aprobadas: login, recuperación de carga y mantenimiento en pantalla |
| Playwright con `playwright.aceptacion.config.js` | 8 aprobadas; son los ocho casos de pantalla de esta selección |
| `npm run build --prefix frontend` | Compilación correcta |

Los 15 casos seleccionados están incluidos en esas suites; **no deben sumarse otra
vez** a los totales de regresión. Los nueve sondeos exploratorios tampoco se cuentan
como casos automáticos aprobados. La API simulada no reemplaza una prueba de integración.

## Límites y pendientes para cerrar la validación

- Ejecutar contra PostgreSQL de pruebas la asignación y operaciones, recargar y
  reiniciar el servicio para comprobar persistencia real de rentas y fotografías.
- Probar dos pestañas asignando la misma unidad; las funciones puras no prueban
  las transacciones ni exclusión mutua del servidor.
- Configurar `AUTH_KEY`, crear la cuenta interna y verificar login, cookies y cierre
  en Render. La implementación cifra usuario y aplica hash a contraseña; esta
  entrega no cifra toda la base ni modifica la base desplegada.
- Ejecutar con personal operativo las cuatro sesiones manuales propuestas y obtener
  su aceptación; comprobar móvil físico y vista previa de impresión real.
- Priorizar H-01 a H-04 y verificar cada corrección antes de cerrarlos.

Las tres pruebas comerciales omitidas por falta de PostgreSQL siguen pendientes;
no son fallos ni aprobaciones. No se realizó despliegue ni se usaron datos productivos.

## Evidencia reproducible y conservación

Las fechas/códigos de salida están en [ejecucion.json](evidencias/ejecucion.json),
los ocho resultados de navegador en [pantallas-resumen.json](evidencias/pantallas-resumen.json)
y los nueve sondeos en [exploracion.json](evidencias/exploracion.json).
`evidencias/` es la fotografía de esta ejecución; repetir las pruebas regenera
`resultados/` y no sobrescribe automáticamente esa evidencia histórica.
Al actualizar este informe, copiar evidencia de una ejecución completa y registrar
nueva fecha y versión. El reporte HTML completo queda en
`resultados/reporte-html/index.html` y contiene capturas adjuntas por caso.
