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

## Deploy en Producción (Google Cloud)

### URLs activas
- **Frontend:** https://stward-task-1cbf3.web.app (Firebase Hosting — static export)
- **Backend:** https://stward-backend-997565014222.us-central1.run.app (Cloud Run)
- **DB:** Neon PostgreSQL — `ep-quiet-mountain-ai8frdzt-pooler.c-4.us-east-1.aws.neon.tech`
- **GCP Project:** `stward-task-1cbf3`
- **Image:** `gcr.io/stward-task-1cbf3/stward-backend:latest`

### Env vars Cloud Run (actuales)
| Variable | Valor |
|----------|-------|
| `DJANGO_ENV` | `production` |
| `DJANGO_SETTINGS_MODULE` | `config.settings` |
| `SECRET_KEY` | (ver MEMORY.md) |
| `DATABASE_URL` | (ver MEMORY.md) |
| `DB_HOST` | `ep-quiet-mountain-ai8frdzt-pooler.c-4.us-east-1.aws.neon.tech` |
| `DB_PORT` | `5432` |
| `POSTGRES_DB` | `neondb` |
| `POSTGRES_USER` | `neondb_owner` |
| `POSTGRES_PASSWORD` | (ver MEMORY.md) |
| `CORS_ALLOWED_ORIGINS` | `https://stward-task-1cbf3.web.app` |
| `GOOGLE_CLIENT_ID` | `997565014222-n7sv0q8tlo30kslbq5fkbgbu0egtaskr.apps.googleusercontent.com` |
| `ALLOWED_HOSTS` | `stward-backend-997565014222.us-central1.run.app` |

### Comandos clave de deploy
```bash
# Rebuild + push backend
cd backend
docker build -t gcr.io/stward-task-1cbf3/stward-backend:latest .
docker push gcr.io/stward-task-1cbf3/stward-backend:latest
gcloud run deploy stward-backend --image gcr.io/stward-task-1cbf3/stward-backend:latest --region us-central1 --project stward-task-1cbf3

# Rebuild + deploy frontend (desde frontend/)
Remove-Item -Recurse -Force out; npm run build; firebase deploy --only hosting

# Actualizar env var (NUNCA usar --set-env-vars, borra todo)
gcloud run services update stward-backend --region us-central1 --project stward-task-1cbf3 --update-env-vars "KEY=VALUE"

# Ver logs
gcloud run services logs read stward-backend --region us-central1 --project stward-task-1cbf3 --limit 50
```

### Estado del deploy (2026-03-02)
- ✅ Frontend en Firebase, ✅ Backend en Cloud Run, ✅ Neon DB conectada
- ✅ Login funcionando — admin@stwards.com / admin123
- ✅ Sprint 10 (Google OAuth + Allowlist) desplegado en producción
- ✅ Fix React hydration errors #418/#423 — Firebase routing corregido para rutas dinámicas

### Pendientes
1. Configurar Celery/Beat en Cloud Run

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
| Sprint 7 | Dashboard & Gantt Consolidado por Workspace + Edición de Subtareas | ✅ COMPLETADO |
| Sprint 8 | Completud & Calidad (delete/reorder subtareas, seguridad, Lighthouse, exportar CSV/PDF) | ✅ COMPLETADO |
| Sprint 9 | UX Dashboard (badges conteo por estado en leyenda) + Deploy Synology NAS | ✅ COMPLETADO |
| Sprint 10 | Google OAuth2 SSO + Allowlist con Roles Pre-asignados | ✅ COMPLETADO |

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
- **Dashboard & Gantt consolidado por Workspace (Sprint 7):** Haciendo clic en el nombre del workspace en el sidebar se navega a `/workspace/[id]`. Muestra dos vistas: **Dashboard** (KPIs globales, resumen por tablero con cards clickables, distribución por estado y prioridad, carga del equipo) y **Gantt** (grupos = tableros, 8 colores distintos por tablero). Hook `useWorkspaceDetail` usa `useQueries` para fetchear todos los boards en paralelo. `workspaceView` en `ui-store.ts`.
- **Edición inline de subtareas (Sprint 7):** En `EditTaskDialog`, cada subtarea tiene un botón de lápiz que activa modo edición inline. Permite cambiar el título (Enter/Escape) y el colaborador asignado. Usa `api.updateTask(subtaskId, { title, assignee_ids })`.
- **Sidebar workspace link:** Título del workspace es un `<Link href="/workspace/[id]">` con estilo botón (`bg-white/10 border border-white/20 rounded-md`). Se resalta con `bg-white/20 border-white/30` cuando estás en esa ruta.
- **Gantt extendido:** Timeline del Gantt (tablero individual y workspace) cubre 13 meses hacia adelante (antes 7). `safety < 18` evita bucle infinito.
- **Eliminar subtareas (Sprint 8):** Botón trash en cada subtarea → confirmación inline "¿Eliminar? ✓ ✕" → `deleteTask(subtaskId)` → `recalculate_parent_progress`. Backend: `TaskService.delete()` ahora llama `recalculate_parent_progress` si `parent_id`.
- **Reordenar subtareas (Sprint 8):** Botones ↑↓ en cada subtarea → swap de `order` entre adyacentes → 2 calls `updateTask`. `SubtaskSchema` expone `order: int`. `TaskUpdateSchema` acepta `order: int | None`. Subtareas renderizadas sorted por `order`.
- **Exportar datos (Sprint 8):** Botones "Exportar CSV" y "Exportar PDF" en Dashboard del tablero y Dashboard del workspace. CSV con BOM UTF-8 (compatible Excel). PDF vía `window.print()` con `@media print` CSS que oculta sidebar y botones. Util: `frontend/src/lib/export-utils.ts`.
- **Seguridad (Sprint 8):** `npm audit fix` aplicó 3 fixes (ajv, minimatch, rollup). 4 HIGH restantes son falsos positivos: `glob/eslint-config-next` (dev-only) y `next` × 2 (no aplican: sin `remotePatterns`, sin RSC inseguro). Backend Python: sin vulnerabilidades conocidas (stack reciente).
- **Performance (Sprint 8):** `next.config.mjs` añade `compress: true` y `experimental.optimizePackageImports`. `globals.css` incluye `@media print` styles. `layout.tsx` ya tenía `lang="es"`, skip link y meta description.
- **Badges conteo en leyenda (Sprint 9):** Leyenda del gráfico de torta (Dashboard tablero y workspace) muestra pill con número de tareas por estado. Dark-mode aware: `bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-100`. `statusCounts` calculado en `useMemo` de `dashboard-view.tsx`; `perStatusCounts` extraído de `statusCounts` en `workspace-dashboard.tsx`.
- **Deploy Synology NAS (Sprint 9):** `frontend/Dockerfile.prod` multi-stage (`deps → builder → runner`) con `output: "standalone"`. `docker-compose.synology.yml` autocontenido (6 servicios, no overlay). `.env.example` sección Synology comentada. `NEXT_PUBLIC_API_URL` se pasa como Docker `ARG` (se bake en bundle cliente en build time).
- **Google OAuth2 SSO + Allowlist (Sprint 10):** Login con Google via `@react-oauth/google`. Backend valida `id_token` con `google-auth` library. `AllowedEmail` model controla quién puede acceder y con qué rol (email específico o dominio completo). Panel `/admin/users` exclusivo para administradores para gestionar la allowlist (agregar email/dominio, asignar rol, importar CSV, eliminar). Link "Control de Acceso" en sidebar visible solo para administradores. Login email+contraseña se mantiene como respaldo.
- **Vistas:** Kanban, Tabla, Dashboard (KPIs + panel Carga del Equipo), Gantt, Dashboard Workspace, Gantt Workspace
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
- **useWorkspaceDetail**: usa `boardKeys.detail(id)` para que TanStack Query deduplique si los boards ya están en cache. Devuelve `allTasks` filtrando `c.tasks ?? []` de todos los boards.
- **Workspace Gantt groups**: boards como grupos (no columnas), 8 colores rotativos. `expandedGroups` se sincroniza vía `useEffect` cuando cambian los boards.
- **editSubtaskMutation**: `api.updateTask(subtaskId, { title, assignee_ids: assigneeId ? [assigneeId] : [] })` — `updateTask` recibe array `assignee_ids`, no `assignee_id` singular (que solo usa `createSubtask`).
- **reorderSubtaskMutation**: swap de `order` entre dos subtareas adyacentes con 2 calls `updateTask` secuenciales. `TaskUpdateSchema.order: int | None = Field(None, ge=0, le=100000)`. `SubtaskSchema.order: int = 0`.
- **deleteSubtask recalculate**: `TaskService.delete()` guarda `parent_id = task.parent_id` antes del soft_delete, luego llama `recalculate_parent_progress(task)` fuera del `transaction.atomic()`. La tarea ya está soft-deleted, así que `deleted_at__isnull=True` la excluye del cálculo.
- **npm audit HIGH falsos positivos**: `glob` vía `eslint-config-next` es dev-only. `next` × 2 requieren configuraciones (remotePatterns, RSC inseguro) que no usamos. 14.2.35 es el último patch de 14.x. Upgrade a 15.x es breaking.
- **exportTasksCSV**: BOM `\uFEFF` + `\r\n` separador. Columnas: Título, Estado, Prioridad, Asignado, Inicio, Fin, Progreso. En `frontend/src/lib/export-utils.ts`.
- **Badges conteo leyenda dark mode**: usar `bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-100` — evitar `bg-slate-100 text-foreground` que en dark mode queda texto claro sobre fondo claro.
- **docker-compose.synology.yml**: autocontenido (NO overlay), usar `-f docker-compose.synology.yml` explícito. `NEXT_PUBLIC_API_URL` es build arg → debe estar en `.env` antes del `--build`.
- **Demo user:** admin@stwards.com / admin123
- **DB volume:** Si cambias credenciales en `.env`, ejecutar `docker compose down -v` para recrear el volumen
- **Google OAuth2**: `GOOGLE_CLIENT_ID` debe estar en `.env` (backend) Y como `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend). Sin valor, `verify_google_token()` retorna `None` silenciosamente.
- **AllowedEmail lookup**: email específico tiene prioridad sobre dominio. Un usuario `a@stwards.com` matchea primero por email exacto, luego por `domain=stwards.com`.
- **google-auth en Docker**: después de añadir a `requirements.txt`, hay que reconstruir la imagen con `docker compose up --build -d`.
- **`locale` prop de GoogleLogin**: NO es un prop válido en `@react-oauth/google`. El idioma del botón lo controla Google automáticamente según el navegador.
- **Primer login Google**: si el usuario NO existe → se crea con datos de Google + rol del `AllowedEmail` + workspace default. Si ya existe → solo actualiza `google_id` y `avatar_url`.
- **`used_at` en AllowedEmail**: se marca la primera vez que el email/dominio se usa para registrar un usuario. Entradas con `used_at = null` → "Pendiente" en la UI.
- **Cloud Run DB vars**: `base.py` lee `DB_HOST`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_PORT` individualmente — NO lee `DATABASE_URL`. Cloud Run debe tener AMBOS sets de vars.
- **React hydration #418/#423**: Con `output: "export"`, Next.js genera HTML estático sin auth. Al rehidratar con auth, `isLoading` difiere → mismatch. Fix: NO usar `if (isLoading) return skeleton` a nivel de page (ej. `page.tsx`). Siempre renderizar la misma estructura; AppSidebar maneja su propio skeleton internamente.
- **Sidebar parpadeo (ClientMount)**: `ClientMount` en `providers.tsx` devolvía `null` → toda la app invisible → skeleton → real (3 transiciones = parpadeo). Fix: eliminar `ClientMount` del wrapping de `{children}` + cambiar `if (isLoading)` a `if (isLoading || !data)` en AppSidebar. Resultado: skeleton consistente en build/hydration → real (1 transición limpia).
- **Firebase routing para rutas dinámicas**: Con `"**" → /index.html`, Firebase servía la home page para `/board/uuid`, causando mismatch de hidratación. Fix: añadir rewrites específicos `/board/**` → `/board/board/index.html` y `/workspace/**` → `/workspace/dashboard/index.html` en `firebase.json`. Requiere `trailingSlash: true` en `next.config.mjs`.
- **WorkspaceClient hydration**: Estaticamente genera con `isLoading=false && !workspace` → render "no encontrado". Client hydrata con `isLoading=true`. Fix: cambiar `if (isLoading)` a `if (isLoading || !workspace)` para que ambas condiciones usen el mismo skeleton.
- **Cloud Run DJANGO_SETTINGS_MODULE**: `config/celery.py` tiene `setdefault(..., "config.settings.development")`. Agregar `DJANGO_SETTINGS_MODULE=config.settings` explícitamente en Cloud Run para evitar que cargue settings de desarrollo.
- **ALLOWED_HOSTS corrupción**: configurar desde cmd.exe Windows puede inyectar artefactos (`& goto lastline 2>NUL || C:\WINDOWS\...`). Siempre verificar con `gcloud run services describe` y corregir con `--update-env-vars`.
- **Firebase CLI en PowerShell**: después de `npm install -g firebase-tools`, reiniciar terminal o usar ruta completa `C:\Users\...\AppData\Roaming\npm\firebase.cmd`.

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
- `backend/apps/accounts/auth.py` - JWT token creation/validation + `verify_google_token()`
- `backend/apps/accounts/api.py` - Auth endpoints (login, register, refresh, google, allowed-emails CRUD)
- `backend/apps/accounts/models.py` - User (google_id, avatar_url) + AllowedEmail model
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
- `frontend/src/lib/hooks/use-workspace-detail.ts` - Hook paralelo para boards de un workspace
- `frontend/src/app/workspace/[id]/page.tsx` - Página consolidada del workspace
- `frontend/src/components/workspace/workspace-dashboard.tsx` - Dashboard multi-board
- `frontend/src/components/workspace/workspace-gantt.tsx` - Gantt multi-board (grupos = tableros)
- `frontend/src/lib/export-utils.ts` - Util `exportTasksCSV()` con BOM UTF-8
- `frontend/Dockerfile.prod` - Build multi-stage standalone para producción (Synology / self-hosted)
- `docker-compose.synology.yml` - Compose autocontenido para Synology NAS (6 servicios)
- `frontend/src/app/admin/users/page.tsx` - Panel de gestión de allowlist (solo administradores)
- `frontend/src/lib/providers.tsx` - GoogleOAuthProvider + ThemeProvider + QueryClientProvider wrappers
