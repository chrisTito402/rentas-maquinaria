# Rentas de Maquinaria · Sprint 1 (MVP)

Los Eskubi Du · Métodos Ágiles de Desarrollo · ITSON

**Meta del Sprint 1:** que un cliente pida su cotización en línea, con el costo de la renta,
y que el personal comercial la vea y la apruebe.

Stack: React 18 + Vite 6 · Express 5 + pg · PostgreSQL

## Correr el proyecto

```bash
# Terminal 1 · backend
cd backend
cp .env.example .env      # y pon tu contraseña de PostgreSQL
npm install
npm run db:crear          # crea la base, las tablas y los datos de ejemplo
npm run dev               # http://localhost:3001/api/salud

# Terminal 2 · frontend
cd frontend
npm install
npm run dev               # http://localhost:5173
```

## Historias del Sprint 1

| HU | Jira | Dueño |
|---|---|---|
| HU-01a Ver catálogo de equipos | KAN-6 | Héctor |
| HU-04 Ver detalle del equipo | KAN-8 | Héctor |
| HU-15a Aprobar cotización | KAN-15 | Héctor |
| HU-13a Costo de la renta | KAN-10 | Chris |
| HU-14a Enviar solicitud de cotización | KAN-11 | Chris |
| HU-06 Registrar datos del cliente | KAN-12 | Katia |
| HU-10 Consultar cotizaciones | KAN-19 | Katia |
