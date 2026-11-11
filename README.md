# Rentas de Maquinaria

Los Eskubi Du · Métodos Ágiles de Desarrollo · ITSON

Comercial y Operaciones usan la misma base PostgreSQL. Las cotizaciones
aprobadas aparecen en Reservaciones hasta que Operaciones asigna las unidades
físicas. Cada unidad sigue su propio recorrido de preparación, entrega y
devolución.

## Alcance de Delivery 1

El panel de Operaciones cubre HU-01 (equipos), HU-02 (apartados), HU-03
(preparación), HU-04 (entrega), HU-05 (rentas activas), HU-08 (devolución),
HU-09 (estado final) y HU-10 (carta responsiva). El flujo de Comercial permite
crear y aprobar las cotizaciones que recibe Operaciones.

El enlace **Gestión** del encabezado abre un panel común para Comercial y
Operaciones. El menú se conserva en Inicio, Cotizaciones, Operación,
Inventario e Historial. Desde el encabezado puedes volver al Catálogo.

En **Cotizaciones**, revisa las solicitudes pendientes y apruébalas.
La confirmación ofrece continuar a **Operación → Por asignar**. Allí se
guardan las unidades físicas; después eliges cuál preparar. No hay saltos
automáticos ni entregas implícitas al aprobar o asignar.

Operación separa **Por asignar**, **Preparación**, **Listos para entregar**,
**En renta**, **Revisión final** y **Preparación detenida**. Esta última
permite retomar la revisión después de una reparación. Cada unidad tiene
una URL propia, un indicador de avance y un siguiente paso. El detalle de
la cotización reúne los enlaces y estados de todas sus unidades. Las rentas
cerradas se consultan en **Historial**.

Las confirmaciones de guardado permanecen hasta cerrarlas o cambiar de
página. Una devolución no puede tener fecha anterior a su entrega.
Los enlaces anteriores `/admin/...` y `/panel/cotizaciones/...` redirigen
al panel unificado.

En **Inventario** aparecen los modelos de Comercial. Registra los identificadores
de las unidades físicas que tienen en inventario. La vista **Disponibles**
descuenta las unidades ocupadas y la cantidad pendiente de asignar de las
cotizaciones aprobadas.

## Arrancar el proyecto

Necesitas Node.js y PostgreSQL. En `backend/.env`, configura `DATABASE_URL`
con la base que usa Comercial. Si es una instalación nueva, inicializa las
tablas de Comercial con `npm run db:crear -- --sin-semilla` y carga su catálogo
de equipos. Ejecuta ese comando únicamente en una base vacía, pues vuelve a
crear las tablas de Comercial.

```bash
# Terminal 1 · API
cd backend
cp .env.example .env
# Edita DATABASE_URL en .env para conectarte a tu base PostgreSQL.
npm ci
npm run db:operacion
npm run dev

# Terminal 2 · interfaz, desde la raíz del proyecto
cd frontend
npm ci
npm run dev
```

`npm run db:operacion` prepara las tablas de Operaciones y retira los equipos
y las rentas de ejemplo de versiones anteriores. Conserva las cotizaciones
de Comercial y los apartados registrados con ellas.

## Prueba del recorrido

1. En [Cotizaciones](http://localhost:5173/gestion/cotizaciones),
   abre una cotización pendiente y apruébala.
2. Usa **Continuar a asignación** para encontrar el mismo folio en
   [Por asignar](http://localhost:5173/gestion/operacion/por-asignar).
3. Indica el identificador de cada unidad física. Si ya existe, debe estar
   disponible y corresponder al equipo cotizado. Si es nueva, se registra con
   el modelo de la cotización.
4. Después de guardar, abre una de las unidades desde la confirmación.
   Registra la preparación. Si queda lista, puedes generar la responsiva
   desde Documentos y registrar la entrega desde Resumen.
   El equipo aparece en **En renta**.
5. Registra la devolución y la revisión final. La renta queda cerrada. Recarga
   el Inventario y comprueba que la unidad conserva su estado final.

## Verificación del flujo

Desde `frontend`, `npm test` verifica las transiciones, las etapas de cada
unidad, la recuperación de mantenimiento y las fechas de devolución.
`npm run test:e2e` prueba el recorrido en Microsoft Edge, la persistencia de
URLs, el menú móvil, la impresión y los errores recuperables. Las pruebas
de navegador simulan la API; no escriben en PostgreSQL. Se requiere Edge
instalado. La comprobación con datos reales requiere la base configurada.
