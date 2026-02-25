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

## Estado Actual del Proyecto

### Sprints completados
| Sprint | Objetivo | Estado |
|--------|----------|--------|
| Sprint 0 | Backend Foundations (auth, service layer, seguridad) | ✅ COMPLETADO |
| Sprint 1 | Frontend Architecture (TanStack Query, Zustand, hooks) | ✅ COMPLETADO |
| Sprint 2 | Quality & Security (tests, CI/CD, rate limiting, CSP) | ✅ COMPLETADO |
| Sprint 3 | Polish & Production (soft-delete, audit, accesibilidad) | ✅ COMPLETADO |
| Sprint 4 | Collaborative Power (multi-usuario, emails, comentarios) | ✅ COMPLETADO |
| Sprint 5 | Roles, Visibilidad & Auto-Gestión (check_overdue, GET /users, permisos) | ✅ COMPLETADO |
| Sprint 6 | Progreso Automático por Subtareas (SubtaskSchema, recalculate_parent_progress) | ✅ COMPLETADO |

### Features implementados (resumen)
- **Auth:** JWT stateless (access 30min + refresh 7d), register, login, /me
- **Workspaces y Boards:** CRUD completo con soft-delete y audit trail
- **Kanban:** Drag & drop (dnd-kit), columnas con estado semántico (Column.status)
- **Tareas multi-usuario:** `TaskAssignment` — múltiples asignados, colores por usuario, progreso individual editable vía deslizadores por colaborador (`assignment_progress` field en `TaskUpdateSchema`)
- **Jerarquía de tareas:** `Task.parent` FK (subtareas), `Task.dependencies` M2M (dependencias entre tareas)
- **Progress automático:** Al mover tarea entre columnas → `round((column.order / (total_columns-1)) * 100)`. COMPLETED siempre = 100%.
- **Auto-move tareas vencidas:** Celery Beat — `check_overdue_tasks` corre diario a las 00:05, mueve tareas con `end_date < hoy` (fuera de DELAYED/COMPLETED) a la columna "Retrasado" del tablero. Servicio `celery-beat` en Docker Compose.
- **Comentarios:** `TaskComment` con `source=app|email`, visible en EditTaskDialog
- **Notificaciones in-app:** Campana en sidebar con badge, polling 30s, tipos: assigned/moved/comment/completed
- **Emails outbound:** Celery + SMTP (Gmail Workspace), template HTML `task_moved.html`, `send_task_moved_email` + `send_assignment_notification`
- **Inbound email:** Webhook `POST /api/v1/webhooks/inbound-email` — reply al email crea comentario en la tarea (Reply-To: `task-{uuid}@reply.stwards.com`)
- **Todos los usuarios en asignaciones:** `GET /api/v1/users` retorna todos los usuarios activos. Hook `useUsers()` con stale 5min. El selector en crear/editar tarea muestra todos los usuarios del sistema (no solo del workspace).
- **Visibilidad por rol:** Admin/Manager/Staff ven todas las tareas del tablero. Usuarios regulares ven solo las tareas donde son `assignee`, colaborador (`TaskAssignment`) o `created_by`. Implementado con `Prefetch` filtrado en `BoardService.get_detail()`.
- **Permisos de workspace:** Todos los miembros del workspace (no solo el owner) pueden crear, editar y mover tareas. `Q(owner=user) | Q(members=user)` + `.distinct()` en `TaskService`.
- **Bloqueo de avance por padre/dependencias:** Al mover una tarea hacia adelante (columna con `order` mayor), `TaskService.move()` valida: (1) si tiene tarea padre, el padre debe tener `progress >= 100`; (2) si tiene dependencias, todas deben tener `progress >= 100`. Mover hacia atrás no está bloqueado.
- **Subtareas internas con progreso proporcional (Sprint 6):** Las subtareas son `Task` objetos con `parent_id` pero **NO aparecen en el tablero Kanban** (`parent_id__isnull=True` en `BoardService.get_detail()`). Se gestionan desde el panel "Subtareas" en `EditTaskDialog`. Cada subtarea tiene 4 estados (Pendiente=0% / En Proceso=50% / Retrasado=25% / Completado=100%) seleccionables con pills de color. `recalculate_parent_progress()` usa **promedio proporcional** (no binario): `round(sum(st.progress) / len(subtasks))`. `createSubtask()` usa `assignee_id` (FK singular). `SubtaskSchema` expone `id, title, progress, assignee`.
- **Vistas:** Kanban, Tabla, Dashboard (KPIs + panel Carga del Equipo), Gantt
- **CI/CD:** GitHub Actions (7 jobs: lint → test → build → E2E → SBOM → security scan)
- **Tests:** 56 backend (pytest, 88% cov) + 18 frontend (Vitest + RTL) + Playwright E2E

### Gotchas críticos
- **Ninja TestClient** causa "multiple NinjaAPIs" → usar `django.test.Client` con prefijo `/api/v1`
- **Vitest config** debe usar extensión `.mts` (no `.ts`) para compatibilidad ESM con Vitest 3
- **Workspace create API** retorna SIN campo `boards` → agregar `boards: []` en cache update
- **User model** tiene campo `username` (AbstractUser) → `create_user` necesita `username=email`
- **Task create API** bug histórico: usar `exclude_none=True` en `payload.dict()` para evitar `assignee_name=NULL`
- **Pagination** cambió formato de respuesta → todos los `setQueryData` en hooks usan `PaginatedResponse<>`
- **celery-beat** requiere servicio separado en Docker Compose; `docker compose restart` NO aplica cambios de config — usar `--force-recreate`
- **Celery healthcheck** sin `-d` flag: `["CMD", "celery", "-A", "config.celery", "inspect", "ping"]` — `$HOSTNAME` no expande en arrays CMD de Docker
- **Visibilidad por rol** usa `Prefetch("columns__tasks", queryset=tasks_qs)` con queryset filtrado — no cambia estructura de la respuesta API
- **Permisos de workspace**: siempre `Q(owner=user) | Q(members=user)` + `.distinct()` para evitar excluir a miembros no-owner
- **Bloqueo de avance**: `HttpError(400, msg)` en `TaskService.move()` cuando padre o dependencia `progress < 100`. Frontend parsea `body.detail` del error para mostrar el mensaje específico en toast.
- **recalculate_parent_progress**: proporcional — `round(sum(st.progress) / len(subtasks))`. Solo actualiza asignaciones donde el usuario tiene al menos una subtarea asignada; sin subtareas → progreso manual intacto.
- **Subtareas NO visibles en tablero**: `parent_id__isnull=True` en `tasks_qs` de `BoardService.get_detail()` — las subtareas existen en DB pero se filtran del tablero. Se crean en primera columna pero nunca se muestran como tarjetas.
- **Mapeo estado→progreso en subtareas**: Pendiente=0, En Proceso=50, Retrasado=25, Completado=100. `progressToSubtaskStatus()` en `edit-task-dialog.tsx`: 0→pending, <40→delayed, <100→in_progress, 100→completed.
- **createSubtask usa `assignee_id`** (FK directo, no array) para que `recalculate_parent_progress` pueda leer `subtask.assignee_id`.
- **Regex `/s` flag**: No compatible con TS target por defecto → usar `[\s\S]` en lugar de `.` con flag `s`.
- **Demo user:** admin@stwards.com / admin123
- **DB volume:** Si cambias credenciales en `.env`, ejecutar `docker compose down -v` para recrear el volumen

### Regla de documentación (OBLIGATORIA)
> Cada vez que se agregue una funcionalidad nueva, se deben actualizar:
> 1. **CLAUDE.md** — sección "Estado Actual" y "Key Files" si aplica
> 2. **SPEC.md** — sprint correspondiente, marcar tarea como ✅
> 3. **MANUAL.md** — documentar la nueva feature desde perspectiva de usuario

## Key Files
- `docker-compose.yml` - Service orchestration (backend, frontend, db, redis, celery, celery-beat)
- `backend/config/settings/base.py` - Shared Django settings (incl. CELERY_BEAT_SCHEDULE)
- `backend/config/settings/development.py` - Dev overrides
- `backend/config/settings/production.py` - Prod security settings
- `backend/config/celery.py` - Celery app configuration
- `backend/apps/accounts/auth.py` - JWT token creation/validation
- `backend/apps/accounts/api.py` - Auth endpoints (login, register, refresh)
- `backend/apps/projects/models.py` - Workspace, Board, Column, Task, TaskAssignment, TaskComment, Notification
- `backend/apps/projects/services.py` - Business logic (Service Layer) incl. role-based visibility
- `backend/apps/projects/api.py` - REST endpoints (thin controllers) incl. GET /users
- `backend/apps/projects/schemas.py` - Request/response validation schemas incl. AssignmentProgressItemSchema
- `backend/apps/projects/tasks.py` - Celery tasks: send_task_moved_email, check_overdue_tasks
- `backend/apps/projects/webhooks.py` - Inbound email webhook (POST /api/v1/webhooks/inbound-email)
- `frontend/src/lib/api.ts` - Frontend API client with JWT
- `frontend/src/lib/auth.ts` - Token storage/management
- `frontend/src/lib/types.ts` - TypeScript type definitions
- `frontend/src/lib/hooks/use-users.ts` - All active users hook (staleTime 5min)
