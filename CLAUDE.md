# Stward Task - Project Instructions

## Stack
- **Backend:** Django 5.1 + Django Ninja (REST API) + PostgreSQL 16 + PyJWT
- **Frontend:** Next.js 14 (App Router) + React 18 + Tailwind CSS + shadcn/ui + dnd-kit
- **Infra:** Docker Compose (todo corre en contenedores)

## Architecture
- Monorepo: `backend/` (Django) + `frontend/` (Next.js)
- **Backend Layers:** API (thin controllers) → Service Layer → Models/ORM
- **Auth:** JWT stateless (PyJWT). Tokens: access (30min) + refresh (7d)
- **Settings:** Split en `config/settings/` (base.py, development.py, production.py)
  - `DJANGO_ENV=development|production` controla qué settings se carga
- Custom user model en `backend/apps/accounts/models.py`
- Auth endpoints en `backend/apps/accounts/api.py` (login, register, refresh, me)
- Business logic en `backend/apps/projects/services.py` (NO en api.py)
- Schemas con validación estricta (Field constraints, enums) en `schemas.py`
- Frontend components: `frontend/src/components/board/` (kanban) + `frontend/src/components/sidebar/`
- UI primitives: shadcn/ui en `frontend/src/components/ui/`
- API client con JWT auto-refresh: `frontend/src/lib/api.ts`
- Token management: `frontend/src/lib/auth.ts`

## Conventions
- UI language: Spanish (es)
- Django settings read from environment variables (.env)
- CORS: permissive in dev, strict in prod (via CORS_ALLOWED_ORIGINS env var)
- All DB access through Django ORM via Service Layer
- Frontend uses TypeScript strictly
- Components follow shadcn/ui patterns (Radix primitives + Tailwind)
- Column business logic uses `Column.status` field (not magic strings)
- Backend linting: ruff (configured in `backend/ruff.toml`)

## Docker
- `docker compose up --build -d` to start everything
- `docker compose exec backend python manage.py migrate` after model changes
- Ports: 3000 (frontend), 8000 (backend)
- DB not exposed to host by default (internal Docker network only)
- Containers run as non-root users

## Key Files
- `docker-compose.yml` - Service orchestration
- `backend/config/settings/base.py` - Shared Django settings
- `backend/config/settings/development.py` - Dev overrides
- `backend/config/settings/production.py` - Prod security settings
- `backend/apps/accounts/auth.py` - JWT token creation/validation
- `backend/apps/accounts/api.py` - Auth endpoints (login, register, refresh)
- `backend/apps/projects/models.py` - Workspace, Board, Column, Task models
- `backend/apps/projects/services.py` - Business logic (Service Layer)
- `backend/apps/projects/api.py` - REST endpoints (thin controllers)
- `backend/apps/projects/schemas.py` - Request/response validation schemas
- `frontend/src/lib/api.ts` - Frontend API client with JWT
- `frontend/src/lib/auth.ts` - Token storage/management
- `frontend/src/lib/types.ts` - TypeScript type definitions
