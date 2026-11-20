# Documento de aceptación y exploración de Operativa

**Proyecto:** Rentas de Maquinaria · **Equipo:** Operativa · **Selección:** 15 casos.

## Objetivo y criterio de selección

Comprobar que cada unidad física avanza de una cotización aprobada al cierre de su
renta, con estados consistentes, documentación accesible y recuperación ante errores.
Se priorizan riesgos que pueden provocar entregas incorrectas, pérdida de equipos
en el flujo, pérdida de evidencia o trabajo repetido para el personal.

Los casos proceden de `tests/flujo.test.mjs` y
`frontend/tests/gestion.spec.js`, antes de agruparlos. Se separaron recorridos largos
para identificar cada fallo y se reforzaron comprobaciones de integridad. No son
15 archivos ni 15 aserciones: son 15 objetivos verificables con identificadores estables.
La aceptación del equipo requiere además ejecutar los pasos manuales con usuarios
representativos en un entorno de pruebas; la automatización es evidencia parcial.

Se excluyen de esta selección los cálculos comerciales, validación del cliente,
infraestructura y autenticación, que conservan sus pruebas de regresión. El enlace
Comercial–Operativa sí se incluye porque es la entrada del trabajo operativo.

## Datos y condiciones de ejecución

- Cotización `COT-0001`, cliente ficticio Constructora del Norte; dos unidades de
  Montacargas M1, `MC-01` y `MC-02`, rentas `R-001` y `R-002`.
- Periodo de ejemplo: 9 al 15 de noviembre de 2026. Para revisión manual usa un
  periodo autorizado del entorno de pruebas y conserva los límites entre fechas.
- Mecánico de ejemplo: Luis; receptor: Cliente; revisión de regreso: Almacén.
- En automatización cada caso recibe datos nuevos. El mock declara la sesión válida
  y usa las funciones reales de asignación/transición para responder a las acciones.
- En revisión manual entra con una cuenta interna en una base de pruebas, prepara
  datos equivalentes y no reutilices un folio ya cerrado. No ejecutes estos pasos
  sobre datos productivos. Conserva capturas y folios de cada ejecución.

## Casos seleccionados

### OP-01 · Cotización aprobada y asignación desde el panel

**Prioridad:** alta. **Origen:** recorrido completo de `gestion.spec.js`.
**Por qué:** valida el traspaso entre equipos y evita interpretar aprobación como entrega.

**Precondición:** cotización pendiente con dos unidades por asignar.
**Pasos:** abrir Cotizaciones → `COT-0001` → Aprobar cotización → Continuar a
asignación; ingresar `MC-01` y `MC-02` y guardar.
**Esperado:** aprobar conserva el detalle y ofrece continuar; aún no existen rentas.
Asignar muestra confirmación y enlaces de revisión; las dos rentas quedan Apartado,
sin preparación ni entrega automáticas.
**Retroalimentación:** confirma que el siguiente paso es claro y que cada acto requiere
una decisión del personal. **Explorar:** volver atrás, folio ya aprobado y doble clic
en Guardar; verificar aparte su efecto real en la base.

### OP-02 · Asignación de varias unidades y trazabilidad

**Prioridad:** alta. **Origen:** primer caso de `flujo.test.mjs`.
**Por qué:** un error en cantidad o vínculo comercial ocasiona asignaciones incorrectas.

**Precondición:** cotización aprobada, dos unidades físicas distintas del modelo correcto.
**Pasos:** asignar ambas unidades; consultar sus detalles y la cotización.
**Esperado:** dos rentas distintas, cliente y periodo correctos, mismo folio comercial y
unidades en Apartado. La automatización valida el resultado de la función real.
**Retroalimentación:** permite detectar pérdidas de folio, cantidades o datos del cliente.
**Explorar:** unidades repetidas con espacios/mayúsculas, modelo incorrecto y unidad ocupada.

### OP-03 · Avance independiente de las unidades

**Prioridad:** alta. **Origen:** primer caso de `flujo.test.mjs`.
**Por qué:** preparar una unidad no debe dar por preparada toda la cotización.

**Precondición:** dos rentas Apartado de una misma cotización.
**Pasos:** preparar solo `MC-01` con resultado listo; consultar `MC-02`.
**Esperado:** una renta en Listos y otra en Preparación; la segunda renta y su unidad
no cambian. La función tampoco modifica los datos recibidos.
**Retroalimentación:** evidencia aislamiento de acciones y evita salidas accidentales.
**Explorar:** alternar entre ambas unidades y preparar la segunda con resultado diferente.

### OP-04 · Clasificación en una sola etapa

**Prioridad:** alta. **Origen:** caso de etapas de `flujo.test.mjs`.
**Por qué:** una renta omitida o duplicada impide priorizar correctamente el trabajo.

**Precondición:** rentas Apartado, preparación pendiente/lista, En renta, En revisión,
En mantenimiento y Cerrada.
**Pasos:** consultar las etapas de Operación y el Historial.
**Esperado:** cada renta figura una vez en su etapa; Apartado aparece en Preparación;
la renta cerrada aparece en Historial. Por asignar contiene cotizaciones pendientes
de asignación, no rentas ya creadas.
**Retroalimentación:** confirma que los listados representan una carga de trabajo confiable.
**Explorar:** filtros sin coincidencias y cambio de etapa mientras se consulta un listado.

### OP-05 · Bloqueo de entrega sin preparación terminada

**Prioridad:** alta. **Origen:** recorrido completo de `flujo.test.mjs`.
**Por qué:** protege contra la salida de un equipo sin revisión concluida.

**Precondición:** renta Apartado o preparación en proceso.
**Pasos:** comprobar que no pueda entregarse; en prueba lógica intentar la transición
deliver en ambos estados.
**Esperado:** rechazo sin cambios de estado ni modificación de los datos originales.
**Retroalimentación:** confirma la regla previa a la entrega y ayuda a explicar por qué
una acción no está disponible. **Explorar:** abrir una URL guardada antes de cambiar el estado.

### OP-06 · Preparación lista habilita la entrega

**Prioridad:** alta. **Origen:** recorrido completo de `flujo.test.mjs` y pantalla de preparación.
**Por qué:** identifica la diferencia entre equipo listo y equipo físicamente entregado.

**Precondición:** unidad asignada pendiente de revisión.
**Pasos:** registrar mecánico, notas y resultado listo; consultar resumen y etapa.
**Esperado:** ready verdadero, estado En preparación y etapa Listos; no hay registro
de entrega hasta confirmarlo expresamente. Una entrega válida permite avanzar.
**Retroalimentación:** comprueba que el sistema facilita el siguiente paso sin ejecutarlo.
**Explorar:** revisión sin mecánico o notas y nueva revisión después de reparación.

### OP-07 · Mantenimiento y reanudación de preparación

**Prioridad:** alta. **Origen:** caso de mantenimiento de `flujo.test.mjs`.
**Por qué:** evita entregar equipos detenidos y permite recuperar su flujo después de reparar.

**Precondición:** renta Apartado.
**Pasos:** registrar preparación con mantenimiento; intentar entrega; retomar preparación
con mecánico, notas y resultado en proceso.
**Esperado:** aparece en Preparación detenida; entrega rechazada; no se admite una
revisión incompleta; al retomar pasa a Preparación y sigue sin estar lista ni entregada.
**Retroalimentación:** comprueba que mantenimiento no equivale a cierre ni entrega.
**Explorar:** varios ciclos mantenimiento–revisión y consulta del historial de eventos.

### OP-08 · Carta responsiva visible para imprimir

**Prioridad:** alta. **Origen:** recorrido completo de `gestion.spec.js`.
**Por qué:** la documentación debe poder usarse cuando se entrega el equipo.

**Precondición:** `MC-01` lista para entregar.
**Pasos:** Documentos → Generar carta responsiva; completar marca y serie, generar y
abrir Ver documento; revisar la vista de impresión y cerrar.
**Esperado:** responsiva visible en modo impresión, marca y serie conservadas; puede
cerrarse y regresar al detalle. No se afirma que se imprimió en papel.
**Retroalimentación:** detecta documentos invisibles o datos de identificación perdidos.
**Explorar:** horómetro negativo, datos largos, varias páginas y ausencia de marca/serie.

### OP-09 · Fotografía recuperable al recargar

**Prioridad:** alta. **Origen:** caso de fotografía de `gestion.spec.js`.
**Por qué:** perder una responsiva firmada elimina evidencia de entrega.

**Precondición:** renta asignada y archivo PNG de prueba.
**Pasos:** Documentos → Subir fotografía; seleccionar, guardar, recargar y abrir Ver fotografía.
**Esperado:** imagen válida en previsualización y al volver a abrirla; en automatización
conserva su ancho de 64 píxeles. La respuesta simulada conserva el archivo entre peticiones.
**Retroalimentación:** confirma recuperación de evidencia en la interfaz, sin demostrar
persistencia física en PostgreSQL. **Explorar:** archivo ilegible, MIME incorrecto, tamaño
excesivo y reemplazo de una fotografía anterior.

### OP-10 · Entrega consistente y recarga del detalle

**Prioridad:** alta. **Origen:** recorrido completo de `gestion.spec.js`.
**Por qué:** una diferencia entre estado de unidad y renta provoca disponibilidad incorrecta.

**Precondición:** `MC-01` lista; `MC-02` pendiente de preparación.
**Pasos:** registrar receptor y confirmar entrega; recargar el detalle de `R-001`.
**Esperado:** confirmación visible, renta y unidad En renta, receptor guardado; misma
URL y opción Registrar devolución después de recargar. La otra unidad sigue en Preparación.
**Retroalimentación:** confirma un estado operativo coherente y navegación recuperable.
**Explorar:** entrega repetida y operación desde dos pestañas; esto último requiere backend real.

### OP-11 · Fechas límite de devolución

**Prioridad:** alta. **Origen:** caso de fechas de `flujo.test.mjs`.
**Por qué:** fechas incoherentes dañan el historial y la interpretación de la renta.

**Precondición:** entrega el 10 de noviembre de 2026.
**Pasos:** intentar devolución el día 9; después registrar devolución el día 10.
**Esperado:** se rechaza la fecha anterior sin cambios; se permite regresar el mismo
día, quedando renta y unidad En revisión.
**Retroalimentación:** confirma el límite exacto de la regla y evita rechazar un regreso legítimo.
**Explorar:** cambio de mes/año y fechas inválidas por HTTP; estas últimas requieren validar la API.

### OP-12 · Cierre, inventario e historial

**Prioridad:** alta. **Origen:** recorrido completo de ambos archivos originales.
**Por qué:** el cierre debe liberar la unidad solo después de la revisión final y conservar trazabilidad.

**Precondición:** renta En renta con preparación, documento y entrega registrados.
**Pasos:** registrar devolución y receptor de regreso; comprobar En revisión;
registrar estado final Disponible con mecánico y notas; consultar Historial
y detalle de `COT-0001`.
**Esperado:** renta Cerrada, unidad Disponible, seis eventos conservados y horómetro
del documento igual a 10; historial y cotización enlazan a la unidad cerrada. `MC-02`
sigue en Preparación.
**Retroalimentación:** confirma disponibilidad final sin perder evidencia del recorrido.
**Explorar:** cierre En mantenimiento y Fuera de servicio; exigir identificación de autorización
no equivale a verificar permisos de un autorizador real.

### OP-13 · Recuperación de un error al guardar

**Prioridad:** alta. **Origen:** error de guardado dentro del recorrido de `gestion.spec.js`.
**Por qué:** el personal no debe reescribir datos ni interpretar como exitosa una operación fallida.

**Precondición:** unidad asignada; primera acción responde con error HTTP 409 simulado.
**Pasos:** llenar preparación con Luis y notas; guardar; leer error y reintentar.
**Esperado:** error visible, campos conservados y renta todavía Apartado; segundo
intento guarda y habilita entrega.
**Retroalimentación:** comprueba recuperación y ausencia de avance falso después de un fallo.
**Explorar:** desconexión, respuesta lenta, cierre de ventana y doble clic; simularlos
con herramientas del navegador o en un ambiente controlado.

### OP-14 · Navegación móvil y enlaces anteriores

**Prioridad:** media. **Origen:** menú móvil de `gestion.spec.js`.
**Por qué:** enlaces compartidos y uso móvil forman parte del trabajo de campo.

**Precondición:** sesión válida; viewport de 390 × 844.
**Pasos:** abrir `/admin/equipos`, navegar a Operación y recargar; abrir
`/panel/cotizaciones/1`, `/gestion/operacion/rentas?x=1` y `/gestion/inicio`.
**Esperado:** redirecciones al panel actual, detalle correcto, parámetro conservado,
sección activa y sin desbordamiento horizontal en detalle e inicio.
**Retroalimentación:** confirma compatibilidad con enlaces antiguos y acceso usable en pantalla pequeña.
**Explorar:** teléfono real, teclado virtual, orientación horizontal y ampliación de texto.

### OP-15 · Calendario y formularios con teclado

**Prioridad:** media. **Origen:** calendario y formularios de `gestion.spec.js`.
**Por qué:** una ventana que atrapa el foco o pierde la selección dificulta la captura de fechas.

**Precondición:** unidad preparada; viewport de 390 × 844.
**Pasos:** abrir Registrar entrega y su calendario; mover fecha con flecha derecha y
Enter; reabrir y pulsar Escape; cerrar formulario con Escape; reabrir, pulsar un
campo y finalmente el fondo de cierre.
**Esperado:** fecha cambia; Escape cierra primero calendario y devuelve el foco al
selector; después cierra formulario y devuelve foco a Registrar entrega. Un clic
dentro no cierra el formulario; el fondo de cierre sí lo cierra.
**Retroalimentación:** permite detectar pérdida de foco y cierres accidentales.
**Explorar:** Tab/Shift+Tab, mes siguiente, lector de pantalla y dispositivo táctil real.

## Criterio de aceptación y retroalimentación

Un caso automático está aprobado solo si pasan todas sus comprobaciones; un caso
omitido o no ejecutado queda pendiente. El resultado manual se registra por separado
con fecha, ambiente, responsable, folio, resultado y evidencia. Los hallazgos tienen
pasos de reproducción y recomendación; no se presentan como defectos resueltos.

Los 15 casos cubren riesgos conocidos, pero no prueban exhaustivamente disponibilidad
concurrente, autorización por roles, persistencia ni carga. La exploración busca
precisamente variaciones fuera del camino establecido. Consulta los resultados
reales en [RESULTADOS.md](RESULTADOS.md) y las sesiones en [EXPLORACION.md](EXPLORACION.md).
