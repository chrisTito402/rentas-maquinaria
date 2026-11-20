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

## Repetir la prueba

Con las dependencias de ambos módulos instaladas y la interfaz compilada, configura `TEST_DATABASE_URL` con la dirección de una base de pruebas en la que puedas crear esquemas. Para incluir las pantallas usa `TEST_BROWSER_CHANNEL=chrome` con Chrome instalado. Ejecuta desde la raíz

```sh
npm run build --prefix frontend
npm run test:operaciones --prefix backend
```

La ejecución crea un esquema nuevo y elimina solo ese esquema al terminar. La salida incluye seis comprobaciones y una fila que agrupa el recorrido. Las capturas nuevas quedan en `tests/aceptacion-operativa/resultados/cierre/`.

El teléfono físico, la aceptación del equipo y el enlace publicado siguen pendientes.
