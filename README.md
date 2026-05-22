# ReMarket — Plataforma C2C de Segunda Mano

Proyecto universitario desarrollado para la asignatura de **Ingeniería Web** —
Grado en Ingeniería Informática, Universidad de Córdoba.

ReMarket es una plataforma web de compra-venta entre particulares (C2C) que permite
publicar, buscar y adquirir productos de segunda mano mediante precio fijo o subasta
con adjudicación automática.

## Funcionalidades principales

- Registro e inicio de sesión con JWT
- Publicación de anuncios con imágenes, categorías y condición del producto
- Venta por precio fijo y subasta con cierre automático
- Sistema de órdenes y simulación de pasarela de pago
- Mensajería directa entre usuarios
- Wishlist con alertas de búsqueda
- Valoraciones tras transacción completada
- Panel de moderación con alertas de precio anómalo

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.12 + FastAPI + SQLModel |
| Base de datos | PostgreSQL 16 (Docker) / SQLite (local) |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Auth | JWT (python-jose) + bcrypt |
| Testing | pytest + httpx (async) / Vitest |
| Infraestructura | Docker + Docker Compose |

---

## Puesta en marcha

### Opción A — Windows (más rápido, sin Docker)

Requisitos: [Python 3.12+](https://www.python.org/downloads/), [uv](https://docs.astral.sh/uv/getting-started/installation/), [Node.js 20+](https://nodejs.org/)

```powershell
git clone https://github.com/Pepe-Alfaro/iw-grupo6
cd iw-grupo6
.\start.ps1
```

El script crea automáticamente el `.env`, instala dependencias, aplica migraciones,
carga datos de prueba y arranca backend y frontend en ventanas separadas.

- Frontend → http://localhost:5173
- API docs → http://localhost:8000/docs

### Opción B — Docker Compose (cualquier OS)

Requisitos: [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
git clone https://github.com/Pepe-Alfaro/iw-grupo6
cd iw-grupo6
docker compose up --build
```

Las migraciones y el seed se ejecutan automáticamente. No hace falta ningún paso adicional.

- Frontend → http://localhost:5173
- API docs → http://localhost:8000/docs

### Opción C — Manual (sin Docker)

```bash
# Backend
cd backend
cp .env.example .env          # ajusta DATABASE_URL si usas PostgreSQL local
uv sync
uv run alembic upgrade head
uv run python -m app.seed
uv run uvicorn app.main:app --reload --port 8000

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

---

## Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Cliente | jorge@remarket.com | Test1234! |
| Cliente | ana@remarket.com | Test1234! |
| Moderador | mod@remarket.com | Mod1234! |

---

## Ejecutar tests

```bash
# Backend
cd backend
uv run pytest tests/ -v --cov=app

# Frontend
cd frontend
npm run test
```

---

## Equipo

- José Alfaro Gómez
- Carlos Chaves Romero
- Elías Martínez López
- Marcos Palomero García
- Jorge Muñiz Madassery
