# Rentas de Maquinaria · Operaciones

Los Eskubi Du · Métodos Ágiles de Desarrollo · ITSON

El módulo operativo sigue una unidad física desde un apartado confirmado hasta
su devolución y revisión final. Usa React y Vite para la interfaz, Express para
la API y PostgreSQL para guardar rentas y equipos.

## Arrancar la demo local

Necesitas Node.js y una base de datos PostgreSQL. Crea una base vacía, por ejemplo
`renta_equipos`, si todavía no tienes una. Si ya existe, la puedes reutilizar.

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

Abre http://localhost:5173. El primer acceso carga los ejemplos operativos.
`npm run db:operacion` prepara las tablas `operacion_equipos` y
`operacion_rentas`. Puedes ejecutarlo de nuevo para comprobar el esquema sin
borrar registros.

## Prueba del recorrido

1. En **Inicio → Reservaciones**, abre **UN-001** de Constructora del Norte.
   Confirma que el folio es **R-013**.
2. Registra la preparación y elige **Equipo listo para entrega**.
3. Confirma la entrega con fecha y receptor. El equipo pasa a **En renta**.
4. En **Otras acciones**, registra la devolución. El equipo pasa a **En revisión**.
5. Registra el estado final **Disponible**. La renta queda **Cerrada**.
6. Recarga y busca `R-013`. Comprueba que el registro aparece como **Finalizada**
   y que **UN-001** sigue **Disponible**.

**Ayuda → Reiniciar la demostración** reemplaza los registros operativos por
los datos de ejemplo. Úsalo con una base de demostración.
