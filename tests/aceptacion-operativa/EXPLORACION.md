# Exploración de Operativa

Corte original del 19 de noviembre. La [verificación del 20 de noviembre](evidencias/cierre/README.md) reúne las correcciones y las pruebas posteriores.

La aceptación sigue pasos conocidos; la exploración cambia datos y secuencias para
buscar problemas no cubiertos por esos pasos. Este documento ofrece sesiones
manuales para el equipo y registra una exploración de lógica realmente ejecutada.
Las sesiones manuales siguientes **no se presentan como realizadas**.

## Preparación y registro

Usar una base de pruebas y una cuenta interna. Crear datos nuevos por sesión;
anotar navegador, dispositivo, versión del código, fecha, responsable y folios.
No usar fotografías o datos personales reales. Registrar qué se intentó incluso
cuando no falle: mensaje recibido, estados antes/después y efecto al recargar.

Formato mínimo de nota:

```text
Sesión / responsable / fecha / ambiente:
Pregunta e hipótesis:
Datos y estado inicial:
Acciones y variaciones:
Resultado observado y evidencia:
Impacto para Operativa:
Reproducción mínima:
Recomendación y responsable de seguimiento:
Estado: observado / pendiente de confirmar / corregido y verificado
```

## Sesiones manuales propuestas

| Sesión | Tiempo sugerido | Objetivo y variaciones | Señales que conviene observar | Casos de apoyo |
|---|---|---|---|---|
| Asignación y disponibilidad | 20 min | Repetir unidad con espacios/mayúsculas; unidad de otro modelo; ocupada; dos pestañas asignando a la vez | Duplicados, asignaciones parciales, mensajes ambiguos, diferencias al recargar | OP-01 a OP-04 |
| Preparación, entrega y evidencia | 25 min | Sin mecánico/notas; mantenimiento y nueva revisión; horómetro negativo; foto dañada, pesada y reemplazada; entrega repetida | Salidas antes de estar listo, pérdida de documento o fotografía, validación insuficiente | OP-05 a OP-10 |
| Regreso y cierre | 20 min | Devolución mismo día/anterior; cambio de año; cierre Disponible, En mantenimiento y Fuera de servicio; autorización vacía | Estados incoherentes, disponibilidad incorrecta, eventos ausentes | OP-11 y OP-12 |
| Recuperación y uso en campo | 25 min | Red lenta, desconexión, reintento y doble clic; enlaces anteriores; móvil real, teclado virtual, Tab y Escape | Formularios borrados, guardado aparente, foco perdido, desbordamiento | OP-13 a OP-15 |

La prueba de dos pestañas exige API y PostgreSQL reales. Una interceptación de
Playwright no permite concluir que hay exclusión mutua o bloqueo de transacciones.
Para móvil, los 390 × 844 del reporte son emulación de tamaño; falta teléfono real.

## Sondeos ejecutados sobre la lógica

Comando reproducible desde la raíz:

```sh
node tests/aceptacion-operativa/explorar.mjs
```

La evidencia completa se genera en `resultados/exploracion.json`. Se ejecutan nueve
preguntas abiertas con funciones reales y datos en memoria. No intervienen cuenta,
cookie, HTTP, PostgreSQL ni Render. No son nueve pruebas nuevas dentro de la selección
de 15 ni sustituyen las sesiones humanas.

| Sondeo | Variación | Observación real | Lectura para el equipo |
|---|---|---|---|
| EXP-01 | `mc-01` y ` MC-01 ` en una asignación | Rechaza identificadores repetidos | La normalización ayuda a evitar asignar físicamente la misma unidad dos veces |
| EXP-02 | Usar MC-01 ya apartada para otra cotización | Rechaza la unidad no disponible | La lógica evita reutilizar inventario ocupado; falta probar concurrencia real |
| EXP-03 | Registrar otra entrega en una renta ya entregada | Rechaza transición por estado | Un reintento posterior no debe duplicar el evento de entrega |
| EXP-04 | Horómetro `-1` en la responsiva | Rechaza la lectura | Protege un dato importante para el documento de entrega |
| EXP-05 | Fotografía con `data:text/plain` | Rechaza el tipo declarado | Hay una primera barrera de formato |
| EXP-06 | Cierre Fuera de servicio sin `authorization` | Exige quién autorizó | Se exige el dato, aunque esto no comprueba permisos de una persona real |
| EXP-07 | Un byte de texto declarado `data:image/png;base64,YQ==` | La lógica acepta y guarda el valor | Hallazgo H-01: el formato declarado no garantiza una imagen decodificable |
| EXP-08 | Cierre final En mantenimiento | Renta Cerrada y unidad En mantenimiento | Cerrar una renta no implica dejar el equipo Disponible |
| EXP-09 | Consultar autor del último evento | Siempre `Administrador` | Hallazgo H-02: no hay trazabilidad por cuenta autenticada |

## Recomendaciones derivadas

**H-01 · Validación de contenido de fotografías.** Prioridad sugerida media.
El impacto es aceptar evidencia ilegible cuando se omite el procesamiento de la
interfaz. Reproducción: ejecutar EXP-07 o llamar `applyOperation` con acción `photo`
y el valor indicado. Se observó en la función compartida, no como petición a la base
real. La API operativa utiliza esa misma función; el recorrido completo por HTTP
y almacenamiento queda pendiente de confirmar. Recomendación: decodificar y validar
el contenido en servidor, conservar límite de tamaño y agregar un caso de regresión
con un falso PNG y uno válido. No se ha corregido en esta entrega.

**H-02 · Autoría de eventos.** Prioridad sugerida media.
El impacto es no poder atribuir un cambio a una cuenta concreta. Reproducción:
EXP-09 muestra `events.at(-1).by === 'Administrador'`; la capa operativa no pasa
identidad autenticada a la función de transición. Recomendación: tomar el identificador
de `req.usuario` en servidor y pasarlo explícitamente a la lógica pura; no aceptar
autoría libre del navegador y conservar los eventos históricos. No se ha corregido
en esta entrega y no implica que se haya probado una intrusión.

## Revisión visual de evidencias realizada

Además de los nueve sondeos se inspeccionaron las capturas de OP-08 en modo impresión
y OP-14 en móvil. Esta revisión sí se realizó; no constituye una sesión manual
completa con el personal.

**H-03 · El panel aparece junto con la responsiva al imprimir.** Prioridad sugerida media.
En [OP-08-impresion.png](evidencias/OP-08-impresion.png) se ven menú lateral, botones y
confirmación antes del documento. Reproducción: generar responsiva, abrirla y emular
media print. La automatización comprueba visibilidad de `.responsiva`, pero no exige
que desaparezca el panel, por lo que pasa con esta observación. Recomendación:
adaptar los selectores de impresión al layout actual de Comercial y añadir una
comprobación de que menú y controles quedan ocultos. Confirmar después la vista
previa de impresión del navegador. No se ha corregido en esta entrega.

**H-04 · Cerrar sesión se muestra pegado al texto del perfil.** Prioridad sugerida baja.
La [captura móvil OP-14](evidencias/OP-14.png) muestra `Personal internoCerrar sesión`
sin separación visual. Revisión del CSS: el reset de botones de `.comercial` prevalece
por orden de carga sobre el estilo de `.acceso-salir`. Recomendación: ajustar la
especificidad del estilo dentro del perfil y volver a revisar escritorio/móvil.
El cierre funciona en las pruebas de login; el problema observado es de presentación.
No se ha corregido en esta entrega.

Los hallazgos se registran para priorización del equipo. Un caso de aceptación
aprobado y un hallazgo exploratorio pueden coexistir porque observan condiciones
diferentes. Los resultados y pendientes generales están en [RESULTADOS.md](RESULTADOS.md).
