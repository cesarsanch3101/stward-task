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
- **Frontend:** https://stward-task-1cbf3.web.app (Firebase Hosting → proxy → Cloud Run SSR)
- **Frontend Cloud Run:** `stward-frontend` (us-central1) — `gcr.io/stward-task-1cbf3/stward-frontend:latest`
- **Backend:** https://stward-backend-997565014222.us-central1.run.app (Cloud Run)
- **DB:** Neon PostgreSQL — `ep-quiet-mountain-ai8frdzt-pooler.c-4.us-east-1.aws.neon.tech`
- **GCP Project:** `stward-task-1cbf3`
- **Backend Image:** `gcr.io/stward-task-1cbf3/stward-backend:latest`

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
| `EMAIL_BACKEND` | `django.core.mail.backends.smtp.EmailBackend` |
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USE_TLS` | `true` |
| `EMAIL_HOST_USER` | `screen@stwards.com` |
| `EMAIL_HOST_PASSWORD` | (App Password Google Workspace) |
| `DEFAULT_FROM_EMAIL` | `Stward Task <noreply@stwards.com>` |
| `INBOUND_EMAIL_ADDRESS` | `cca91010c6927746fa43@cloudmailin.net` |
| `INBOUND_EMAIL_SECRET` | `stward-inbound-2026-xk9p` |

### Comandos clave de deploy
```bash
# --- BACKEND ---
cd backend
docker build -t gcr.io/stward-task-1cbf3/stward-backend:latest .
docker push gcr.io/stward-task-1cbf3/stward-backend:latest
gcloud run deploy stward-backend --image gcr.io/stward-task-1cbf3/stward-backend:latest --region us-central1 --project stward-task-1cbf3

# --- FRONTEND SSR (Next.js standalone → Cloud Run) ---
# Desde frontend/ — build con NEXT_PUBLIC_ baked en bundle:
docker build -f Dockerfile.prod \
  --build-arg NEXT_PUBLIC_API_URL=https://stward-backend-997565014222.us-central1.run.app/api/v1 \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=997565014222-n7sv0q8tlo30kslbq5fkbgbu0egtaskr.apps.googleusercontent.com \
  -t gcr.io/stward-task-1cbf3/stward-frontend:latest .
docker push gcr.io/stward-task-1cbf3/stward-frontend:latest
gcloud run deploy stward-frontend --image gcr.io/stward-task-1cbf3/stward-frontend:latest --region us-central1 --project stward-task-1cbf3 --allow-unauthenticated --port 3000

# Firebase Hosting solo redistribuir (si cambian headers/rewrites):
firebase deploy --only hosting

# Actualizar env var backend (NUNCA usar --set-env-vars, borra todo)
gcloud run services update stward-backend --region us-central1 --project stward-task-1cbf3 --update-env-vars "KEY=VALUE"

# Ver logs
gcloud run services logs read stward-backend --region us-central1 --project stward-task-1cbf3 --limit 50
gcloud run services logs read stward-frontend --region us-central1 --project stward-task-1cbf3 --limit 50
```

### Estado del deploy (2026-03-05)
- ✅ Frontend SSR en Cloud Run (`stward-frontend`), Firebase Hosting proxia con `"run": { "serviceId": "stward-frontend" }`
- ✅ Backend en Cloud Run, ✅ Neon DB conectada
- ✅ Login funcionando — admin@stwards.com / admin123
- ✅ Sprint 12 (Identificación de colaboradores + AllowedEmail nombre) desplegado en producción
- ✅ Email outbound activo — `noreply@stwards.com` (alias de `screen@stwards.com`) vía SMTP Gmail
- ✅ Email inbound activo — Cloudmailin free tier, webhook `/api/v1/webhooks/inbound-email`
- ✅ Migración `0005_allowedemail_name` ejecutada en Neon DB vía Cloud Run Job

### Pendientes
_(ninguno crítico)_

### Patrón para ejecutar migraciones en producción (Neon DB)
```bash
# Crear job temporal con las vars mínimas y ejecutar
gcloud run jobs create run-migrate \
  --image gcr.io/stward-task-1cbf3/stward-backend:latest \
  --region us-central1 --project stward-task-1cbf3 \
  --command "python" --args "manage.py,migrate" \
  --set-env-vars "DJANGO_ENV=production,DJANGO_SETTINGS_MODULE=config.settings,SECRET_KEY=...,DB_HOST=...,POSTGRES_DB=neondb,POSTGRES_USER=neondb_owner,POSTGRES_PASSWORD=...,DB_PORT=5432,ALLOWED_HOSTS=localhost" \
  --execute-now --wait
gcloud run jobs delete run-migrate --region us-central1 --project stward-task-1cbf3 --quiet
```

### Cloud Run Job — check_overdue_tasks (configurado 2026-03-04)
- **Job:** `check-overdue-tasks` (us-central1)
- **Scheduler:** `check-overdue-tasks-daily` — diario 00:05 hora Guatemala (`America/Guatemala`)
- **Comando:** `python manage.py check_overdue_tasks`
- **Management command:** `backend/apps/projects/management/commands/check_overdue_tasks.py`
- **SA:** `997565014222-compute@developer.gserviceaccount.com`
- **Actualizar job** (tras rebuild backend): `gcloud run jobs update check-overdue-tasks --image gcr.io/stward-task-1cbf3/stward-backend:latest --region us-central1 --project stward-task-1cbf3`
- **Ejecutar manualmente:** `gcloud run jobs execute check-overdue-tasks --region us-central1 --project stward-task-1cbf3 --wait`

## Sprint 12 — COMPLETADO: Identificación de Colaboradores + Allowlist Nombre + Email

### Objetivo
Hacer visibles los emails/nombres de los colaboradores en tareas y subtareas,
y agregar campo `name` al AllowedEmail para pre-registrar nombre antes del primer login Google.

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `backend/apps/accounts/models.py` | `AllowedEmail` + `name = CharField(null=True, blank=True)` |
| `backend/apps/accounts/migrations/0005_allowedemail_name.py` | Migración nueva (generar con makemigrations) |
| `backend/apps/accounts/schemas.py` | `AllowedEmailSchema` + `AllowedEmailCreateSchema` con `name: str \| None` |
| `backend/apps/accounts/api.py` | En `google_auth()`: si `allowed.name` → usar como `first_name`/`last_name` al crear user |
| `frontend/src/lib/types.ts` | `AllowedEmail` interface + `name?: string` |
| `frontend/src/components/board/edit-task-dialog.tsx` | Subtarea row: mostrar nombre+email junto al avatar; Progreso: email bajo el nombre |
| `frontend/src/app/(auth)/admin/users/page.tsx` | Input "Nombre" en form individual; columna Nombre en tabla; CSV col 3 opcional |

### Detalles de implementación

**Backend — `google_auth()` en `api.py`:**
```python
# Si allowed.name está seteado y el usuario es nuevo
if created and allowed.name:
    parts = allowed.name.strip().split(" ", 1)
    User.objects.filter(pk=user.pk).update(
        first_name=parts[0],
        last_name=parts[1] if len(parts) > 1 else "",
    )
```

**Frontend — Subtarea row en `edit-task-dialog.tsx`:**
```tsx
{st.assignee && (
  <div className="flex items-center gap-1">
    <Avatar className="h-5 w-5">...</Avatar>
    <div className="flex flex-col leading-tight">
      <span className="text-xs font-medium">
        {st.assignee.first_name || st.assignee.email}
      </span>
      {st.assignee.first_name && (
        <span className="text-[10px] text-muted-foreground">{st.assignee.email}</span>
      )}
    </div>
  </div>
)}
```

**Frontend — CSV formato extendido (3ª columna opcional):**
```
email_o_dominio,rol,nombre
cesar@stwards.com,desarrollador,Cesar Sanchez
stwards.com,gestor,
```

### Notas
- `UserMinimalSchema` ya expone `email` → sin cambio de backend para UI de tareas
- Campo `name` en AllowedEmail es OPCIONAL — no rompe flujos existentes
- Migración local: `docker compose exec backend python manage.py migrate`
- Deploy: rebuild backend + frontend → `gcloud run deploy` ambos + `firebase deploy --only hosting`

---

## Email Configuration (ACTIVO)
- **Proveedor outbound:** Google Workspace SMTP — `screen@stwards.com` autentica, `noreply@stwards.com` es alias
- **Envío:** `smtp.gmail.com:587` con App Password (16 chars) de `screen@stwards.com`
- **Inbound:** Cloudmailin free tier (10,000 msgs/mes) — plus-addressing `cca91010c6927746fa43+task-{uuid}@cloudmailin.net`
  - Webhook: `POST /api/v1/webhooks/inbound-email?token=stward-inbound-2026-xk9p`
  - Formato: JSON Normalized
  - Account Cloudmailin: `admin@stwards.com`
- **Archivos clave:**
  - `backend/apps/projects/tasks.py` - `send_task_moved_email` (outbound + Reply-To), `send_assignment_notification`
  - `backend/apps/projects/webhooks.py` - Inbound JSON webhook (Cloudmailin format)
  - `backend/templates/projects/email/task_moved.html` - Template HTML del email
- **Test rápido de envío:**
  ```bash
  docker compose exec backend python manage.py shell -c "
  from django.core.mail import send_mail
  from django.conf import settings
  send_mail('Test', 'OK', settings.DEFAULT_FROM_EMAIL, ['screen@stwards.com'])
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
| Sprint 11 | Deploy Producción: Firebase SSR + Cloud Run Job + bug fixes Celery/red | ✅ COMPLETADO |
| Sprint 12 | Identificación de colaboradores + AllowedEmail nombre + Email outbound/inbound | ✅ COMPLETADO |

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
- **Inbound email:** Webhook `POST /api/v1/webhooks/inbound-email` — reply al email crea comentario en la tarea. Reply-To usa Cloudmailin plus-addressing: `cca91010c6927746fa43+task-{uuid}@cloudmailin.net`. Acepta JSON Normalized de Cloudmailin.
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
- **Identificación de colaboradores + AllowedEmail nombre (Sprint 12):** Campo `name` en `AllowedEmail` (migración `0005_allowedemail_name`). Al crear usuario vía Google, si `allowed.name` está seteado se usa como `first_name/last_name`. Panel Control de Acceso muestra columna "Nombre" y acepta nombre en formulario individual y como 3ª columna en CSV. `EditTaskDialog`: subtarea row muestra nombre+email junto al avatar; selector inline muestra `nombre — email`; sección "Progreso por Colaborador" muestra email como subtítulo.
- **Sidebar colapsable:** Botones `PanelLeftClose/PanelLeftOpen` para colapsar/expandir. Estado en `useUIStore.sidebarOpen`. Colapsado: strip `w-12` con solo el botón de expandir. Expandido: `w-72`. NO auto-colapsa al navegar (fue revertido por UX).
- **CSV import mejorado (Control de Acceso):** Auto-detecta delimitador (`;` o `,`). Strip BOM `\uFEFF`. Normalización de rol case-insensitive. 3ª columna opcional: `email_o_dominio;rol;nombre`. Mejor parsing de error de API en `onError`.
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
- **Firebase routing para rutas dinámicas (OBSOLETO — reemplazado por SSR)**: Problema histórico con static export. Hoy en día Firebase proxia TODO a `stward-frontend` Cloud Run (SSR), por lo que no hay mismatch de hidratación.
- **WorkspaceClient hydration (OBSOLETO con SSR)**: Era necesario cambiar `if (isLoading)` a `if (isLoading || !workspace)` con static export. Con SSR, el servidor ya renderiza el estado correcto.
- **Parpadeo sidebar RESUELTO (SSR)**: Causa raíz era `output: "export"` — Firebase siempre servía `index.html` → React mismatch → flash. Fix definitivo: `output: "standalone"` + Cloud Run service `stward-frontend` + Firebase rewrite con `"run": { "serviceId": "stward-frontend", "region": "us-central1" }`.
- **(auth) route group**: `src/app/(auth)/layout.tsx` contiene el `<AppSidebar>` compartido. Páginas: `(auth)/page.tsx`, `(auth)/board/[id]/`, `(auth)/workspace/[id]/`, `(auth)/admin/users/`. `login/` permanece fuera. El sidebar monta UNA sola vez y persiste entre navegaciones.
- **production.py CSP FRONTEND_URL**: `connect-src` e `img-src` incluyen `FRONTEND_URL` env var (default `https://stward-task-1cbf3.web.app`). Configurar vía `--update-env-vars FRONTEND_URL=...` en Cloud Run backend.
- **login page autocomplete**: Inputs del form deben tener `autoComplete`: email→`"email"`, password→`"current-password"` (login) / `"new-password"` (registro), firstName→`"given-name"`, lastName→`"family-name"`.
- **api.ts singleton refresh**: `_refreshPromise` módulo-level evita race condition cuando múltiples 401 simultáneos intentan refrescar el token en paralelo. `fetchNoContent` tiene guard `!window.location.pathname.startsWith("/login")` antes de redirigir.
- **api.ts fetchNoContent retry**: wrappea el primer `fetch()` en try/catch → si hay error de red (connection reset / Cloud Run rotation), reintenta una vez automáticamente. Aplica a DELETE, PUT, POST sin body de respuesta.
- **Celery sin broker en Cloud Run (CRÍTICO)**: `send_assignment_notification.delay()` en `signals.py` y `send_task_moved_email.delay()` en `services.py` crashan con HTTP 500 si no hay Redis. FIX: ambas llamadas en try/except — si no hay broker, la operación principal (crear/mover tarea) sigue y el email se omite con warning en logs.
- **Cloud Run min-instances=1 backend**: con `min-instances=0`, Cloud Run rota instancias durante sesiones activas → corta conexiones TCP a mitad de request → DELETE/PUT fallan con ERR_CONNECTION_RESET. FIX: `--min-instances=1` en `stward-backend`.
- **CreateWorkspaceDialog botón sidebar**: usar `variant="ghost"` + `className="text-white/70 hover:bg-white/10 hover:text-white border border-white/20"` — `variant="outline"` tiene fondo blanco incompatible con sidebar oscuro.
- **Cloud Run DJANGO_SETTINGS_MODULE**: `config/celery.py` tiene `setdefault(..., "config.settings.development")`. Agregar `DJANGO_SETTINGS_MODULE=config.settings` explícitamente en Cloud Run para evitar que cargue settings de desarrollo.
- **ALLOWED_HOSTS corrupción**: configurar desde cmd.exe Windows puede inyectar artefactos (`& goto lastline 2>NUL || C:\WINDOWS\...`). Siempre verificar con `gcloud run services describe` y corregir con `--update-env-vars`.
- **Firebase CLI en PowerShell**: después de `npm install -g firebase-tools`, reiniciar terminal o usar ruta completa `C:\Users\...\AppData\Roaming\npm\firebase.cmd`.
- **Django Ninja route ordering (CRÍTICO)**: rutas con path literal (ej. `/bulk`) deben declararse ANTES de rutas con parámetro (ej. `/{entry_id}`). Si se declara primero `/{entry_id}`, Django Ninja matchea `"bulk"` como el parámetro → HTTP 405. Fix: mover `POST /allowed-emails/bulk` antes de `PATCH/DELETE /{entry_id}`.
- **CSV import delimiter**: el CSV de allowlist usa `;` como separador (Excel en español). Frontend auto-detecta: `const delimiter = lines[0].includes(";") ? ";" : ",";`. Strip BOM: `raw.replace(/^\uFEFF/, "")`. Sin esto, la primera entrada se corrompe.
- **Sidebar colapsable**: `useUIStore` tiene `sidebarOpen` (bool), `toggleSidebar`, `setSidebarOpen`. Collapsed strip: `w-12`. Full sidebar: `w-72`. No usar `setSidebarOpen(false)` en el Link del workspace — oculta boards y botones del footer.
- **AllowedEmail.name en google_auth()**: lógica de split: `parts = allowed.name.strip().split(" ", 1)` → `first_name=parts[0], last_name=parts[1] if len(parts) > 1 else ""`. Solo aplica si `created and allowed.name`.

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
- `frontend/src/app/(auth)/layout.tsx` - Layout compartido para páginas autenticadas (AppSidebar montado una sola vez)
- `frontend/Dockerfile.prod` - Build multi-stage standalone → Cloud Run frontend (también sirve para Synology)
