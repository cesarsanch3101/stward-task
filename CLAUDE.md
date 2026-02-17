# Stward Task - Project Instructions

## Stack
- **Backend:** Django 5.1 + Django Ninja (REST API) + PostgreSQL 16
- **Frontend:** Next.js 14 (App Router) + React 18 + Tailwind CSS + shadcn/ui + dnd-kit
- **Infra:** Docker Compose (todo corre en contenedores)

## Architecture
- Monorepo: `backend/` (Django) + `frontend/` (Next.js)
- API: Django Ninja en `backend/apps/projects/api.py`, schemas en `schemas.py`
- Custom user model en `backend/apps/accounts/models.py`
- Frontend components: `frontend/src/components/board/` (kanban) + `frontend/src/components/sidebar/`
- UI primitives: shadcn/ui en `frontend/src/components/ui/`
- API client: `frontend/src/lib/api.ts`

## Conventions
- UI language: Spanish (es)
- Django settings read from environment variables (.env)
- CORS enabled for localhost:3000 in dev
- All DB access through Django ORM
- Frontend uses TypeScript strictly
- Components follow shadcn/ui patterns (Radix primitives + Tailwind)

## Docker
- `docker compose up --build -d` to start everything
- `docker compose exec backend python manage.py migrate` after model changes
- Ports: 3000 (frontend), 8000 (backend), 5435 (postgres)

## Key Files
- `docker-compose.yml` - Service orchestration
- `backend/config/settings.py` - Django settings
- `backend/apps/projects/models.py` - Board, Column, Task models
- `backend/apps/projects/api.py` - REST endpoints
- `frontend/src/lib/api.ts` - Frontend API client
- `frontend/src/lib/types.ts` - TypeScript type definitions
