# Tournament Manager V2

Sistema web para la gestion de torneos (tesis), con arquitectura separada en `frontend` (React + Vite) y `backend` (Express + Prisma).

## Stack principal

- Frontend: React, Vite, React Router, React Query, React Hook Form, Zod, Tailwind, Zustand.
- Backend: Node.js, Express, Prisma ORM, Zod, JWT, Socket.IO.
- Base de datos: configurada mediante `DATABASE_URL` (Prisma).

## Estructura del proyecto

```text
Codigo/
  backend/      # API REST, auth, modulos de torneo, Prisma
  frontend/     # Aplicacion web
  package.json  # Scripts para correr frontend + backend juntos
```

## Requisitos

- Node.js 18+ (recomendado 20+).
- npm 9+.
- Motor de base de datos compatible con Prisma (segun `DATABASE_URL`).

## Instalacion

Desde la raiz del proyecto:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

## Variables de entorno (backend)

Crea `backend/.env` (o ajusta segun tu configuracion) con al menos:

```env
DATABASE_URL=
PORT=3000
NODE_ENV=development
COOKIE_SECRET=
JWT_SECRET=
JWT_EXPIRES_IN=1d
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
VENTANA_LOGIN_MINUTOS=15
MAX_LOGIN_INTENTOS=10
```

> Nota: no subas archivos `.env` al repositorio.

## Scripts disponibles

En la raiz:

- `npm run dev`: levanta backend y frontend en paralelo.
- `npm run dev:backend`: backend con nodemon.
- `npm run dev:frontend`: frontend con Vite.
- `npm run build`: build de frontend.
- `npm run start`: corre backend en modo normal.
- `npm run db:migrate`: ejecuta migraciones de Prisma.
- `npm run db:studio`: abre Prisma Studio.

## Ejecucion en desarrollo

1. Configura variables de entorno.
2. Ejecuta migraciones:
   ```bash
   npm run db:migrate
   ```
3. Levanta el proyecto:
   ```bash
   npm run dev
   ```

Frontend:
- `http://localhost:5173` (o el siguiente puerto libre que muestre Vite).

Backend:
- `http://localhost:3000` (o el puerto definido en `PORT`).

## Problemas comunes

- `EADDRINUSE:3000`: el puerto 3000 esta ocupado. Cierra el proceso previo o cambia `PORT`.
- Vite cambia a `5174`/`5175`: normal cuando `5173` ya esta en uso.
- Error de CORS: agrega el origen correcto en `ALLOWED_ORIGINS`.

## Estado del repositorio

Este proyecto esta en desarrollo activo para la tesis.  
Se recomienda usar ramas por feature y PRs pequenos para cambios grandes.

