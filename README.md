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

El enlace **Acceso para personal comercial** del pie del catálogo abre el
panel comercial (`/comercial`), común para Comercial y Operaciones. Su menú
reúne Inicio, Cotizaciones, Operación, Inventario e Historial, y enlaza al catálogo público.

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
Los enlaces anteriores `/gestion/...`, `/admin/...` y `/panel/cotizaciones/...` redirigen
al panel comercial.

En **Inventario** aparecen los modelos de Comercial. Registra los identificadores
de las unidades físicas que tienen en inventario. La vista **Disponibles**
descuenta las unidades ocupadas y la cantidad pendiente de asignar de las
cotizaciones aprobadas.

## Arrancar el proyecto

### Acceso del personal (HU-16 / KAN-17)

El panel `/comercial` requiere iniciar sesión en `/login`. Los enlaces antiguos
`/admin`, `/gestion` y `/panel/cotizaciones` también terminan en el panel protegido.
El catálogo, las fichas y `POST /api/cotizaciones/web` continúan públicos.
La API exige sesión para consultar/aprobar cotizaciones y para toda Operación.

Antes de arrancar el backend, configura `AUTH_KEY`: 32 bytes aleatorios expresados
como 64 caracteres hexadecimales. Puedes generarlos con:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Guarda la clave únicamente en `backend/.env` local o en las variables de entorno
del servicio de Render. Configura `APP_ORIGIN` con el origen público exacto, sin
barra final (por ejemplo `https://tu-servicio.onrender.com`); para Vite local usa
`http://localhost:5173`. Si abres Vite por `127.0.0.1`, usa ese mismo origen.
No cambies `AUTH_KEY` sin una migración de recifrado: permite descifrar los usuarios
y calcular su índice de búsqueda. Conserva un respaldo privado de la clave.

Para crear una cuenta, configura temporalmente `AUTH_USUARIO` y
`AUTH_CONTRASENA` (12 a 256 caracteres) en el entorno del backend y ejecuta:

```sh
npm run auth:crear-usuario --prefix backend
```

Para crear la primera cuenta administradora usa `AUTH_ROL=admin`. Al entrar, abre **Cuentas del equipo** para dar de alta a las demás personas, cambiar su perfil o desactivar su acceso. Cambiar un perfil o desactivar una cuenta cierra sus sesiones.

| Perfil | Qué puede hacer |
| --- | --- |
| Administrador | Administrar cuentas, aprobar cotizaciones y registrar movimientos |
| Personal de operaciones | Asignar unidades y registrar rentas, fallas, trabajos de taller y cancelaciones |
| Auxiliar comercial | Capturar cotizaciones y consultar operaciones |
| Solo consulta | Ver el panel, el inventario y los documentos |

Los valores de `AUTH_ROL` son `admin`, `operador`, `auxiliar` y `consulta`. El comando usa `auxiliar` si omites el perfil.
Las cuentas creadas antes de los roles quedaron como `admin`.

El comando crea las tablas de autenticación que falten, sin borrar datos ni
reemplazar cuentas existentes. Retira `AUTH_USUARIO` y `AUTH_CONTRASENA` del entorno
después. En Render ejecútalo desde la consola del servicio con las mismas variables
de conexión y clave. No existe una contraseña predeterminada, registro público ni
recuperación de contraseña. Todas las cuentas tienen acceso al mismo panel.

El nombre de usuario se normaliza a minúsculas y se cifra con AES-256-GCM; un HMAC
con clave derivada independiente permite buscarlo. Las contraseñas se guardan con
Argon2id y sal individual. Las sesiones duran ocho horas y se guardan en PostgreSQL
con el hash del token, mediante cookie HttpOnly y SameSite=Lax (Secure en producción).
Cerrar sesión revoca el token; desactivar `auth_usuarios.activo` bloquea sus sesiones.
El login limita a diez intentos por IP cada quince minutos en cada proceso del
servidor; si se despliega con varias instancias, se requiere un limitador compartido.

La migración `backend/db/auth.sql` se aplica al arrancar en producción y con el
comando de creación de cuentas en local. No uses `db:crear` para agregar el login.
Las claves y credenciales nunca se incluyen en el frontend.

Validación: `npm test --prefix backend`, `npm test --prefix frontend`,
`npm run build --prefix frontend` y `npm run test:e2e --prefix frontend`.
Los casos de autenticación HTTP usan una base simulada y los de navegador simulan
la API. Antes de publicar, verifica además en PostgreSQL de pruebas el acceso real,
la recarga, el cierre y la persistencia de sesiones tras reiniciar el servicio.

### Publicar en Render

Usa un Web Service con Node, la rama que contenga estos cambios, región Oregon
y Root Directory vacío. La base PostgreSQL debe estar en la misma región.

Build Command:

```sh
npm ci --prefix backend && npm ci --prefix frontend --include=dev && npm run build --prefix frontend
```

Start Command:

```sh
npm start --prefix backend
```

Agrega `NODE_ENV=production` y `DATABASE_URL` con la Internal Database URL de
Render. No guardes esa dirección en GitHub. No necesitas configurar `PORT`.
En Health Check Path puedes usar `/api/salud`.

Al arrancar, el servidor prepara las tablas que falten. Carga los ejemplos
solamente si la base comercial es nueva y conserva los datos al reiniciar.
No uses `db:crear` en Render porque ese comando borra y recrea las tablas.
La página y la API se abren desde el mismo enlace, incluso al recargar una
pantalla interna del panel.

Pruebas locales, después de instalar las dependencias:

```sh
npm run build --prefix frontend
npm test --prefix backend
npm test --prefix frontend
```

Las pruebas de arranque simulan la conexión. Después de publicar hay que abrir
`/api/salud` y comprobar con PostgreSQL real el guardado de una renta y su foto,
también después de recargar. El plan gratuito de PostgreSQL en Render vence
a los 30 días.

### Preparar la base local

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

1. En [Cotizaciones](http://localhost:5173/comercial/cotizaciones),
   abre una cotización pendiente y apruébala.
2. Usa **Continuar a asignación** para encontrar el mismo folio en
   [Por asignar](http://localhost:5173/comercial/operacion/por-asignar).
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

Para presentar las **15 pruebas seleccionadas de Operativa**, consulta
[`tests/aceptacion-operativa/README.md`](tests/aceptacion-operativa/README.md).
Incluye justificación, pasos de aceptación, guías exploratorias, resultados reales
y evidencias. Ejecuta el paquete con `npm run test:aceptacion --prefix frontend`.
Son siete casos de lógica y ocho de pantalla con API simulada; no reemplazan la
validación con PostgreSQL real y Render.

Desde `frontend`, `npm test` verifica las transiciones, las etapas de cada
unidad, la recuperación de mantenimiento y las fechas de devolución.
`npm run test:e2e` prueba el recorrido en Microsoft Edge, la persistencia de
URLs, el menú móvil, la impresión y los errores recuperables. Las pruebas
de navegador simulan la API; no escriben en PostgreSQL. Se requiere Edge
instalado. La comprobación con datos reales requiere la base configurada.
