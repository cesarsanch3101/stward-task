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

## Email Configuration (pendiente de completar)
- **Proveedor:** Google Workspace (dominio propio registrado en Google)
- **Envío (SMTP):** `smtp.gmail.com:587` con App Password de 16 chars
  - Crear App Password en: myaccount.google.com → Seguridad → Contraseñas de aplicaciones
  - Variables `.env`: `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
- **Inbound (respuesta por email → comentario):** pendiente de decidir proveedor
  - Opción A (recomendada): Cloudmailin — gratis hasta 200/mes, POST al webhook `/api/v1/webhooks/inbound-email`
  - Opción B: Gmail API + Google Pub/Sub (más complejo)
  - Opción C: deshabilitar por ahora (comentarios solo desde la app)
- **Archivos clave:**
  - `backend/apps/projects/tasks.py` - Celery task `send_task_moved_email`
  - `backend/apps/projects/webhooks.py` - Endpoint inbound `/api/v1/webhooks/inbound-email`
  - `backend/templates/projects/email/task_moved.html` - Template HTML del email
  - `.env.example` - Variables de referencia (`INBOUND_EMAIL_DOMAIN`, `INBOUND_EMAIL_SECRET`)
- **Test rápido de envío:**
  ```bash
  docker compose exec backend python manage.py shell -c "
  from django.core.mail import send_mail
  send_mail('Test', 'OK', 'noreply@tudominio.com', ['tu@email.com'])
  "
  ```

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
