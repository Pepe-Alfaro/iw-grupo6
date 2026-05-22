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
| Base de datos | PostgreSQL 16 |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Auth | JWT (python-jose) + bcrypt |
| Testing | pytest + httpx (async) / Vitest |
| Infraestructura | Docker + Docker Compose |

## Puesta en marcha

```bash
# Con Docker (recomendado)
cp backend/.env.example backend/.env
docker compose up --build
docker compose exec backend alembic upgrade head

# Sin Docker
cd backend && uv sync && uv run uvicorn app.main:app --reload --port 8000
cd frontend && npm install && npm run dev
```

## Ejecutar tests

```bash
cd backend
uv run pytest tests/ -v --cov=app
```

## Equipo

- José Alfaro Gómez
- Carlos Chaves Romero
- Elías Martínez López
- Marcos Palomero García
- Jorge Muñiz Madassery
