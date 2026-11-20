# Comprobación de operaciones
20 de noviembre de 2026, PostgreSQL 18 local y Chrome, con datos de prueba

| Qué revisamos | Resultado |
| --- | --- |
| Cuentas | El administrador creó una cuenta desde el panel y cambió su perfil. Cambiar el perfil o desactivar la cuenta retiró las sesiones anteriores |
| Permisos | Administración y operaciones pudieron registrar cambios. Auxiliar comercial y solo consulta pudieron ver operaciones |
| Asignación | Al intentar asignar una misma unidad a dos cotizaciones al mismo tiempo, una se guardó y la otra mostró que estaba ocupada |
| Falla y taller | Se registraron falla, revisión, ingreso, trabajo y salida, con el nombre de quien hizo el cambio |
| Preventivo y cancelación | El preventivo bloqueó el día programado. Cancelar antes de entregar conservó el motivo, la persona y el historial |
| Documentos | Una foto válida se conservó al volver a abrir el servidor. Una imagen ilegible se rechazó. El PDF muestra solo la responsiva |
| Pantallas | Se comprobó el acceso por enlace directo, la separación del perfil en escritorio y móvil simulado, la agenda, el inventario y el historial |

[Gestión de cuentas](01-cuentas.png) · [Perfil en móvil](02-inicio-movil.png) · [Vista de impresión](03-responsiva.png) · [Responsiva en PDF](responsiva.pdf)

## Revisión de las 17 historias

| Historia | Qué comprobamos en local |
| --- | --- |
| HU-01-01 · Iniciar sesión | Entramos con cuatro perfiles, la pantalla privada pidió iniciar sesión y una cuenta desactivada perdió acceso |
| HU-01-02 · Cerrar sesión | Al salir, la sesión anterior perdió el permiso de consultar y guardar aunque se volviera a usar |
| HU-01-03 · Administrar cuentas de Operaciones | El administrador creó una cuenta y cambió su perfil, cambiar el perfil o desactivar la cuenta retiró el acceso anterior |
| HU-01-04 · Aplicar permisos a las acciones operativas | Administrador y operador pudieron guardar, auxiliar y consulta solo pudieron leer, el historial guardó quién hizo el movimiento |
| HU-02-01 · Ordenar los pendientes en el dashboard | Comparamos las seis tarjetas con los registros, abrimos las listas y revisamos el mensaje cuando estaban vacías |
| HU-02-02 · Identificar entregas y regresos por atender | La agenda mostró unidad, folio y fecha, los enlaces de entrega y regreso llevaron a la renta correcta |
| HU-02-03 · Mostrar fallas y mantenimientos pendientes | Abrimos el preventivo desde el inicio, al resolver una falla dejó de aparecer y el total bajó |
| HU-03-01 · Reportar falla durante la renta | Guardamos fecha, mecánico y descripción en la renta, una fecha anterior a la entrega fue rechazada |
| HU-03-02 · Registrar revisión y resultado de la falla | Probamos dejar una falla pendiente, resolverla en el lugar y mandarla a taller, solo se cerraron las fallas de la reparación |
| HU-04-01 · Registrar ingreso a mantenimiento o taller | El ingreso guardó motivo y fecha, pudimos ver el equipo en taller y se bloquearon la asignación y la entrega |
| HU-04-02 · Registrar el trabajo de mantenimiento o reparación | Guardamos trabajo, resultado y mecánico, el registro siguió al reiniciar el servidor con la misma base |
| HU-04-03 · Liberar una máquina de mantenimiento | La salida pidió trabajo y revisión, el equipo regresó a su renta, a preparación o a disponible según su situación |
| HU-04-04 · Programar mantenimiento preventivo | Programamos el preventivo, comprobamos el bloqueo de su fecha y completamos el trabajo desde ese mismo registro |
| HU-05-01 · Buscar unidades desde Inventario | Buscamos por serie y modelo con mayúsculas y acentos, al volver desde la ficha se conservó el filtro y una búsqueda vacía de resultados mostró el aviso |
| HU-05-02 · Consultar la ficha operativa de una unidad | Abrimos la ficha de una unidad sin renta y el historial de otra con trabajo de taller, también abrimos el detalle de su renta |
| HU-06-01 · Cancelar un apartado operativo antes de la entrega | Se pidió motivo para cancelar antes de entregar, cancelar durante el taller dejó la máquina en mantenimiento y una renta entregada rechazó la cancelación |
| HU-06-02 · Consultar las cancelaciones operativas | Comprobamos folio, motivo y autor en el historial, se distinguieron las rentas cerradas de las canceladas y se conservaron dos cancelaciones de una unidad |

La agenda incluye atrasos y los próximos siete días, el preventivo bloquea el día programado. El equipo puede confirmar ambas reglas en su revisión.

## Repetir la prueba

Con las dependencias de ambos módulos instaladas y la interfaz compilada, configura `TEST_DATABASE_URL` con la dirección de una base de pruebas en la que puedas crear esquemas. Para incluir las pantallas usa `TEST_BROWSER_CHANNEL=chrome` con Chrome instalado. Ejecuta desde la raíz

```sh
npm run build --prefix frontend
npm run test:operaciones --prefix backend
```

La ejecución crea un esquema nuevo y elimina solo ese esquema al terminar. La salida incluye siete comprobaciones y una fila que agrupa el recorrido. Las capturas nuevas quedan en `tests/aceptacion-operativa/resultados/cierre/`.

El teléfono físico, la aceptación del equipo y el enlace publicado siguen pendientes.
