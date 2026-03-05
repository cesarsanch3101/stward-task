# SPEC.md — Contrato Arquitectónico v1.0
## Stward Task — Kanban Board Application
**Fecha:** 2026-02-17
**Autor:** AG-ARCHITECT (Mesa Agéntica SASE)
**Estado:** SPRINT 10 COMPLETADO — Google OAuth2 + Allowlist con Roles

---

## 1. RESUMEN EJECUTIVO

Stward Task es una aplicación Kanban funcional en estado **prototipo** (MVP incompleto). Tras una auditoría exhaustiva por los agentes AG-BACKEND, AG-FRONTEND y AG-INFRA, se identificaron **35 hallazgos críticos** en backend, **10 categorías de deuda técnica** en frontend, y **18 gaps de infraestructura**.

### Veredicto: NO APTO PARA PRODUCCIÓN

| Capa | Score | Hallazgos Críticos |
|------|-------|---------------------|
| Backend | 2/10 | 10 CRITICAL, 16 HIGH |
| Frontend | 3.3/10 | Estado, errores, testing = 0 |
| Infraestructura | 2/10 | Sin CI/CD, sin auth, root containers |

---

## 2. HALLAZGOS POR AGENTE

### 2.1 AG-BACKEND — Django + Django Ninja

#### CRITICAL (Bloquean producción)

| # | Hallazgo | OWASP | Archivo | Línea |
|---|----------|-------|---------|-------|
| B1 | **Sin autenticación en NINGÚN endpoint** | A01 | `api.py` | todos |
| B2 | **Sin autorización** — `User.objects.first()` hardcodeado | A01 | `api.py` | 41-48 |
| B3 | **SECRET_KEY con fallback inseguro** `"unsafe-default-key"` | A02 | `settings.py` | 14 |
| B4 | **Sin validación de input** — strings sin límite, progress sin cap | A03 | `schemas.py` | 37-40 |
| B5 | **Denormalización peligrosa** — `assignee` FK + `assignee_name` duplicado | — | `models.py` | 129-134 |
| B6 | **Magic strings** en lógica de negocio (`"completado"`, `"progreso"`) | — | `api.py` | 191-195 |
| B7 | **Race conditions** en reordenamiento de tareas | — | `api.py` | 180-209 |
| B8 | **Sin logging ni manejo de errores** | — | `api.py` | todos |
| B9 | **Container ejecuta como root** | A05 | `Dockerfile` | — |
| B10 | **Dev server `runserver`** en lugar de gunicorn | A05 | `Dockerfile` | CMD |

#### HIGH

| # | Hallazgo | Archivo |
|---|----------|---------|
| B11 | Credenciales DB hardcodeadas como defaults | `settings.py:72-76` |
| B12 | Sin headers de seguridad (HSTS, CSP, X-Frame) | `settings.py` |
| B13 | Sin rate limiting | — |
| B14 | Sin paginación en endpoints de listado | `api.py` |
| B15 | N+1 queries en algunos endpoints | `api.py` |
| B16 | Sin service layer — lógica de negocio en API | `api.py` |
| B17 | Sin repository pattern | — |
| B18 | Sin tests (0 archivos de test) | — |
| B19 | `progress` permite valores > 100 (sin constraint DB) | `models.py:145` |
| B20 | Sin validación `start_date < end_date` | `models.py:135-144` |
| B21 | Sin soft-delete — CASCADE borra todo sin recuperación | `models.py` |
| B22 | Sin audit trail (`created_by`, `updated_by`) | — |
| B23 | CORS permisivo en DEBUG | `settings.py:117` |
| B24 | Sin connection pooling (`CONN_MAX_AGE`) | `settings.py` |
| B25 | `psycopg2-binary` en lugar de `psycopg2` compilado | `requirements.txt` |
| B26 | Settings monolítico (sin split dev/prod) | `config/settings.py` |

---

### 2.2 AG-FRONTEND — Next.js 14 + React 18

#### CRITICAL

| # | Hallazgo | Archivo(s) |
|---|----------|-----------|
| F1 | **Sin gestión de estado** — useState disperso, prop drilling masivo | `kanban-board.tsx`, todos |
| F2 | **Sin manejo de errores** — solo `console.log`, 0 feedback al usuario | todos los componentes |
| F3 | **Sin form library** — 8 useState por formulario, sin validación | `create-task-dialog.tsx` |
| F4 | **Sin TanStack Query** — fetch manual sin caché, retry, ni dedup | `api.ts` |
| F5 | **Sin Zustand** — estado cliente no centralizado | — |
| F6 | **Sin tests** (0 archivos de test) | — |

#### HIGH

| # | Hallazgo | Impacto |
|---|----------|---------|
| F7 | Sin loading skeletons — UI se congela | UX |
| F8 | Sin error boundaries — crash = pantalla blanca | Estabilidad |
| F9 | Sin React.memo ni useMemo — re-renders en drag | Performance |
| F10 | Sin toast/notification system | UX |
| F11 | Sin custom hooks (useWorkspaces, useTasks, useDragDrop) | Arquitectura |
| F12 | Componentes monolíticos (WorkspaceMenu = 285 líneas, SRP violado) | Mantenibilidad |
| F13 | Stale state en EditTaskDialog (useState no sincroniza con prop) | Bug |
| F14 | Date parsing frágil (`new Date(dateStr + "T00:00:00")`) | Bug potencial |
| F15 | Sin accesibilidad (ARIA, keyboard nav, focus management) | a11y |
| F16 | Sin AbortController en requests | Memory leak |
| F17 | Next.js config vacío — sin security headers | Seguridad |
| F18 | Sin dark mode toggle (infra existe pero no UI) | Feature |

---

### 2.3 AG-INFRA — Docker, CI/CD, Seguridad

#### CRITICAL

| # | Hallazgo | Impacto |
|---|----------|---------|
| I1 | **Sin CI/CD pipeline** — 0 GitHub Actions | Calidad |
| I2 | **Containers como root** (ambos Dockerfiles) | Seguridad |
| I3 | **DB expuesta en host** (port 5435) | Seguridad |
| I4 | **Sin TLS/SSL** entre servicios | OWASP A02 |
| I5 | **Sin SBOM** ni vulnerability scanning | Supply chain |

#### HIGH

| # | Hallazgo | Impacto |
|---|----------|---------|
| I6 | Sin multi-stage builds — imágenes bloated | DevOps |
| I7 | Sin `.dockerignore` para backend | Build |
| I8 | Sin reverse proxy (Nginx/Traefik) | Producción |
| I9 | Sin backup strategy para PostgreSQL | Data loss |
| I10 | Sin resource limits en containers | Estabilidad |
| I11 | Sin structured logging (JSON) | Observabilidad |
| I12 | Sin monitoring (Sentry, Prometheus) | Operaciones |
| I13 | Sin linting backend (ruff/black) | Calidad |
| I14 | Bind mounts en producción | Seguridad |
| I15 | PostgreSQL sin password encryption config | Seguridad |
| I16 | `ALLOWED_HOSTS` incluye `0.0.0.0` | Host header injection |
| I17 | Sin health check para frontend | DevOps |
| I18 | Sin secrets management (Docker secrets) | Seguridad |

---

## 3. ARQUITECTURA OBJETIVO (Target State)

### 3.1 Backend — Arquitectura en Capas (SOLID)

```
┌─────────────────────────────────────────────────────┐
│                    API Layer                         │
│  Django Ninja Routers + JWT Auth + Rate Limiting     │
│  (Validación de request, serialización de response)  │
├─────────────────────────────────────────────────────┤
│                  Service Layer                       │
│  WorkspaceService, BoardService, TaskService         │
│  (Lógica de negocio, orquestación, transacciones)    │
├─────────────────────────────────────────────────────┤
│                Repository Layer                      │
│  WorkspaceRepository, BoardRepository, TaskRepo      │
│  (Acceso a datos, queries optimizados)               │
├─────────────────────────────────────────────────────┤
│                  Domain Models                       │
│  Workspace, Board, Column, Task, TaskAssignment      │
│  (UUID v4, multi-user logic, progress scoring)       │
├─────────────────────────────────────────────────────┤
│                   Database                           │
│  PostgreSQL 16 + 3NF + Strategic Denorm              │
│  (Migrations reversibles, CHECK constraints)         │
└─────────────────────────────────────────────────────┘
```

### 3.2 Frontend — Arquitectura Cuádruple de Estado

```
┌──────────────────────────────────────────────────────┐
│                   Pages (App Router)                  │
│  Server Components + Suspense Boundaries              │
├──────────────────────────────────────────────────────┤
│              Container Components                     │
│  Hooks de negocio (useBoard, useTasks, useWorkspace)  │
│  TanStack Query (server state) + Zustand (UI state)   │
├──────────────────────────────────────────────────────┤
│            Presentational Components                  │
│  Props-only, sin side effects, React.memo             │
│  Framer Motion (micro-animaciones con layoutId)       │
├──────────────────────────────────────────────────────┤
│                   UI Primitives                       │
│  shadcn/ui + Radix + Tailwind CSS 4                   │
│  Variables CSS para temas + tipografía enterprise      │
├──────────────────────────────────────────────────────┤
│                   API Layer                           │
│  Type-safe client (generado desde OpenAPI)             │
│  Zod schemas para validación runtime                  │
│  4 estados: Loading | Error | Success | Revalidating  │
└──────────────────────────────────────────────────────┘
```

### 3.3 Infraestructura — Docker + CI/CD

```
┌─────────────────────────────────────────────────────┐
│                 GitHub Actions CI/CD                  │
│  Lint → Test → Build → Scan → SBOM → Deploy          │
│  Kill Switch: CRITICAL_SECURITY_VULNERABILITY_FOUND   │
├─────────────────────────────────────────────────────┤
│               Docker Compose (prod)                   │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐             │
│  │  Nginx  │→ │ Next.js │  │  Django  │              │
│  │ (proxy) │  │  :3000  │  │  :8000   │              │
│  └────┬────┘  └─────────┘  └────┬─────┘             │
│       │                         │                     │
│  ┌────┴────────────────────────┴─────┐               │
│  │     PostgreSQL 16 (internal only)  │               │
│  │     + pgBouncer + pg_dump cron     │               │
│  └────────────────────────────────────┘               │
├─────────────────────────────────────────────────────┤
│  Non-root containers │ Multi-stage builds │ Secrets   │
│  Resource limits │ Health checks │ Structured logging  │
└─────────────────────────────────────────────────────┘
```

---

## 4. PLAN DE IMPLEMENTACIÓN POR SPRINTS

### SPRINT 0 — Foundations (Semana 1) ✅ COMPLETADO
> Objetivo: Hacer el codebase seguro y testeable

| Task | Prioridad | Estado |
|------|-----------|--------|
| Implementar JWT auth (PyJWT stateless) | CRITICAL | ✅ |
| Añadir autorización en todos los endpoints | CRITICAL | ✅ |
| Eliminar SECRET_KEY default, forzar env vars | CRITICAL | ✅ |
| Crear service layer (WorkspaceService, BoardService, TaskService) | HIGH | ✅ |
| Dual assignee: FK `assignee` + `assignee_name` para externos | HIGH | ✅ |
| Reemplazar magic strings por `Column.status` field semántico | HIGH | ✅ |
| Añadir constraints DB (progress 0-100, dates) | HIGH | ✅ |
| Configurar Dockerfiles non-root + multi-stage | HIGH | ✅ |
| Crear `.dockerignore` para backend | MEDIUM | ✅ |
| Split settings (base/dev/prod) con DJANGO_ENV | MEDIUM | ✅ |
| Configurar ruff para backend linting | MEDIUM | ✅ |

### SPRINT 1 — Frontend Architecture (Semana 2) ✅ COMPLETADO
> Objetivo: Arquitectura frontend enterprise-grade

| Task | Prioridad | Estado |
|------|-----------|--------|
| Instalar y configurar TanStack Query | CRITICAL | ✅ |
| Instalar y configurar Zustand | CRITICAL | ✅ |
| Crear custom hooks (useBoard, useTasks, useWorkspaces) | CRITICAL | ✅ |
| Implementar 4 estados (Loading/Error/Success/Revalidating) | CRITICAL | ✅ |
| Añadir React Hook Form + Zod en formularios | HIGH | ✅ |
| Implementar toast/notification system | HIGH | ✅ |
| Añadir Error Boundaries | HIGH | ✅ |
| Separar componentes container vs presentational | HIGH | ✅ |
| Implementar React.memo + useMemo donde aplique | MEDIUM | ✅ |
| Añadir skeleton loaders | MEDIUM | ✅ |
| Implementar Framer Motion (layoutId, AnimatePresence) | MEDIUM | ✅ |

### SPRINT 2 — Quality & Security (Semana 3) ✅ COMPLETADO
> Objetivo: Testing, CI/CD, seguridad

| Task | Prioridad | Estado |
|------|-----------|--------|
| Crear GitHub Actions CI pipeline (7 jobs) | CRITICAL | ✅ |
| Implementar pytest + pytest-django (51 tests, 96% cov) | CRITICAL | ✅ |
| Implementar Vitest + React Testing Library (18 tests) | CRITICAL | ✅ |
| Implementar Playwright E2E con Page Object Model | HIGH | ✅ |
| Añadir security headers (CSP, X-Frame via middleware) | HIGH | ✅ |
| Configurar rate limiting (sliding window, 429 + Retry-After) | HIGH | ✅ |
| Añadir SBOM generation (Syft SPDX JSON) | MEDIUM | ✅ |
| Kill Switch en CI (Grype fail-on critical) | MEDIUM | ✅ |
| Configurar structured logging (JSON en prod) | MEDIUM | ✅ |
| Añadir paginación a endpoints de listado (PageNumberPagination) | MEDIUM | ✅ |

### SPRINT 3 — Polish & Production (Semana 4) ✅ COMPLETADO
> Objetivo: Production-ready

| Task | Prioridad | Estado |
|------|-----------|--------|
| Soft-delete cascade (Workspace→Board→Column→Task) | MEDIUM | ✅ |
| Audit trail (created_by, updated_by) en todos los modelos | MEDIUM | ✅ |
| Column soft-delete + audit (migration 0006) | MEDIUM | ✅ |
| DELETE /columns/{column_id} endpoint | MEDIUM | ✅ |
| Admin: soft-delete filter + audit fields | MEDIUM | ✅ |
| Dark mode toggle | MEDIUM | ✅ (ya existía) |
| Accesibilidad: skip-to-content, keyboard DnD, ARIA | MEDIUM | ✅ |
| Nginx reverse proxy config | HIGH | ✅ (ya existía) |
| PostgreSQL backup strategy (pg_dump + cron) | HIGH | ✅ (scripts/backup.sh) |
| Connection pooling (CONN_MAX_AGE=600) | MEDIUM | ✅ (ya existía) |
| Resource limits en Docker Compose | MEDIUM | ✅ (docker-compose.prod.yml) |
| API versioning (v1/) | LOW | ✅ (ya existía) |
| OpenAPI spec generation | LOW | ✅ (Django Ninja /api/v1/docs) |

---

### SPRINT 4 — Collaborative Power ✅ COMPLETADO
> Objetivo: Tareas multi-usuario y notificaciones inteligentes

| Task | Prioridad | Estado |
|------|-----------|--------|
| Implementar tabla `TaskAssignment` (M2M con metadata) | HIGH | ✅ migration 0008 |
| Sistema de colores automáticos por usuario (7 colores Monday-style) | MEDIUM | ✅ `TaskService.sync_assignments()` |
| Progress automático por posición de columna (`column.order / (total-1) * 100`) | HIGH | ✅ `TaskService.move()` |
| Integración Celery + Redis + SMTP para emails | CRITICAL | ✅ `config/celery.py`, `tasks.py` |
| `send_assignment_notification` — email al asignar tarea | HIGH | ✅ `tasks.py` + `signals.py` |
| `send_task_moved_email` — email al mover tarea, con template HTML | HIGH | ✅ `tasks.py`, `templates/projects/email/task_moved.html` |
| Sistema de comentarios `TaskComment` (app + email) | HIGH | ✅ migration 0007, `CommentService` |
| Notificaciones in-app `Notification` con campana en sidebar | HIGH | ✅ `NotificationService`, `notification-bell.tsx` |
| Inbound email webhook → comentario en tarea | MEDIUM | ✅ `webhooks.py` → `POST /api/v1/webhooks/inbound-email` |
| Jerarquía de tareas: `Task.parent` FK (subtareas) | MEDIUM | ✅ migration 0009 |
| Dependencias entre tareas: `Task.dependencies` M2M | MEDIUM | ✅ migration 0009 |
| Manual de usuario (`MANUAL.md`) | MEDIUM | ✅ 15 secciones en español |
| Panel "Carga del Equipo" en Dashboard (tabla usuario × estado) | MEDIUM | ✅ `dashboard-view.tsx` — TeamWorkloadPanel |

---

### SPRINT 5 — Roles, Visibilidad & Auto-Gestión ✅ COMPLETADO
> Objetivo: Control de acceso por rol, auto-mantenimiento del tablero, selector de usuarios global

| Task | Prioridad | Estado |
|------|-----------|--------|
| Auto-move tareas vencidas a "Retrasado" (`check_overdue_tasks` Celery Beat, 00:05 diario) | HIGH | ✅ `tasks.py` |
| Servicio `celery-beat` en Docker Compose + healthcheck disable | HIGH | ✅ `docker-compose.yml` |
| `CELERY_BEAT_SCHEDULE` en `settings/base.py` (crontab hour=0, minute=5) | HIGH | ✅ |
| `GET /api/v1/users` — todos los usuarios activos para asignaciones | HIGH | ✅ `api.py` |
| Hook `useUsers()` en frontend (staleTime 5min, reemplaza `useWorkspaceMembers` en forms) | MEDIUM | ✅ `use-users.ts` |
| Visibilidad por rol en `BoardService.get_detail()` con `Prefetch` filtrado | HIGH | ✅ `services.py` |
| — Admin / Manager / Staff: ven TODAS las tareas del tablero | HIGH | ✅ |
| — Usuario regular: ve solo tareas donde es assignee, colaborador o created_by | HIGH | ✅ |
| Permisos de workspace extendidos a miembros (no solo owner) en create/update/move | HIGH | ✅ |
| — `Q(owner=user) \| Q(members=user)` + `.distinct()` en `TaskService` | HIGH | ✅ |
| `AssignmentProgressItemSchema` — `{user_id, progress}` en `TaskUpdateSchema.assignment_progress` | MEDIUM | ✅ `schemas.py` |
| Deslizadores por colaborador en `EditTaskDialog` (progreso individual editable) | MEDIUM | ✅ `edit-task-dialog.tsx` |
| Bloqueo de avance por tarea padre: `progress < 100` → `HttpError(400)` en `TaskService.move()` | HIGH | ✅ `services.py` |
| Bloqueo de avance por dependencias: todas deben tener `progress >= 100` antes de avanzar | HIGH | ✅ `services.py` |
| Frontend: mensaje de error específico en toast al intentar avanzar tarea bloqueada | MEDIUM | ✅ `use-tasks.ts` |

---

### SPRINT 6 — Subtareas Internas con Progreso Proporcional ✅ COMPLETADO

**Objetivo:** Subtareas gestionadas internamente (no visibles en el tablero Kanban), con 4 estados visuales (Pendiente/En Proceso/Retrasado/Completado) y progreso proporcional automático para el colaborador asignado.

| Tarea | Prioridad | Estado |
|-------|-----------|--------|
| `SubtaskSchema` simplificado (`id, title, progress, assignee`) en `schemas.py` | HIGH | ✅ `schemas.py` |
| `BoardService.get_detail()`: `parent_id__isnull=True` — subtareas NO en tablero | HIGH | ✅ `services.py` |
| `TaskService.recalculate_parent_progress()` — promedio proporcional | HIGH | ✅ `services.py` |
| Hook en `TaskService.move()` + `update()` → llama a `recalculate_parent_progress` | HIGH | ✅ `services.py` |
| Prefetch `subtasks__assignee` en `BoardService.get_detail()` | MEDIUM | ✅ `services.py` |
| `Subtask` type en `types.ts` + campo `subtasks: Subtask[]` en `Task` | HIGH | ✅ `types.ts` |
| `createSubtask()` en `api.ts` con `assignee_id` singular (FK directo) | HIGH | ✅ `api.ts` |
| Panel "Subtareas" en `EditTaskDialog`: 4 pills de estado + mini barra de progreso | HIGH | ✅ `edit-task-dialog.tsx` |
| Helpers `SUBTASK_STATUSES`, `progressToSubtaskStatus()` en `edit-task-dialog.tsx` | MEDIUM | ✅ `edit-task-dialog.tsx` |

**Mapeo estado→progreso:** Pendiente=0% · En Proceso=50% · Retrasado=25% · Completado=100%
**Cálculo:** `round(sum(st.progress for st in user_subtasks) / len(user_subtasks))`

---

### SPRINT 7 — Dashboard & Gantt Consolidado por Workspace + Edición de Subtareas ✅ COMPLETADO

**Objetivo:** Vista unificada de todas las tareas de un workspace (multi-board), navegable desde el sidebar. Edición inline de subtareas en el diálogo de tarea.

| Tarea | Prioridad | Estado |
|-------|-----------|--------|
| Sidebar: workspace title como `<Link href="/workspace/[id]">` con estilo botón activo | HIGH | ✅ `app-sidebar.tsx` |
| `workspaceView: "dashboard" \| "gantt"` en `ui-store.ts` | MEDIUM | ✅ `ui-store.ts` |
| Hook `useWorkspaceDetail`: `useQueries` paralelo para todos los boards del workspace | HIGH | ✅ `use-workspace-detail.ts` |
| Página `/workspace/[id]/page.tsx` con header, toggle Dashboard/Gantt, auth guard | HIGH | ✅ `app/workspace/[id]/page.tsx` |
| `WorkspaceDashboard`: KPIs globales, resumen por tablero, gráficas estado/prioridad, carga del equipo | HIGH | ✅ `workspace-dashboard.tsx` |
| `WorkspaceGantt`: grupos = boards, 8 colores distintos, mismo zoom que board gantt | HIGH | ✅ `workspace-gantt.tsx` |
| Gantt individual y workspace extendido a 13 meses adelante (antes 7) | MEDIUM | ✅ `gantt-view.tsx`, `workspace-gantt.tsx` |
| Edición inline de subtareas (pencil icon → Input + assignee select + save/cancel) | HIGH | ✅ `edit-task-dialog.tsx` |

**Ruta:** `/workspace/[id]` — sin cambios de backend, solo frontend.
**Hook:** `useWorkspaceDetail` reutiliza `boardKeys.detail(id)` → TanStack Query deduplica fetches ya en cache.

---

### SPRINT 8 — Completud & Calidad ✅ COMPLETADO

**Objetivo:** Completar UX de subtareas (delete + reorder), auditoría de seguridad, mejoras Lighthouse, y exportación de datos CSV/PDF.

| Tarea | Prioridad | Estado |
|-------|-----------|--------|
| Delete subtarea: botón trash + confirm inline + `deleteTask()` | HIGH | ✅ `edit-task-dialog.tsx` |
| `TaskService.delete()` → llamar `recalculate_parent_progress` si subtarea | HIGH | ✅ `services.py` |
| `SubtaskSchema` añade `order: int = 0` | MEDIUM | ✅ `schemas.py` |
| `TaskUpdateSchema` añade `order: int | None = None` | MEDIUM | ✅ `schemas.py` |
| Reorder subtareas: botones ↑↓ + swap de `order` con 2 calls `updateTask` | HIGH | ✅ `edit-task-dialog.tsx` |
| `Subtask` type añade `order: number`, `updateTask` payload añade `order?: number` | MEDIUM | ✅ `types.ts`, `api.ts` |
| `npm audit fix` — corrige ajv, minimatch, rollup (3 paquetes) | HIGH | ✅ `package-lock.json` |
| `next.config.mjs` — `compress: true` + `optimizePackageImports` | MEDIUM | ✅ `next.config.mjs` |
| `globals.css` — `@media print` styles para exportar PDF | MEDIUM | ✅ `globals.css` |
| `export-utils.ts` — `exportTasksCSV()` con BOM UTF-8 | HIGH | ✅ `export-utils.ts` |
| Botones "Exportar CSV" y "Exportar PDF" en Dashboard tablero y workspace | HIGH | ✅ `dashboard-view.tsx`, `workspace-dashboard.tsx` |

**Vulnerabilidades aceptadas (no corregibles sin breaking changes):**
- `glob/eslint-config-next` HIGH → dev-only, no llega a producción
- `next` × 2 HIGH → no aplican: sin `remotePatterns`, sin RSC inseguro. Fix requiere Next.js 16 (breaking).

---

### SPRINT 9 — UX Dashboard + Deploy Synology ✅ COMPLETADO

**Objetivo:** Mejorar legibilidad del dashboard con badges de conteo por estado, y añadir soporte de despliegue self-hosted en Synology NAS.

| Tarea | Prioridad | Estado |
|-------|-----------|--------|
| `statusCounts` en `useMemo` de `dashboard-view.tsx` (pending/in_progress/delayed/completed) | MEDIUM | ✅ `dashboard-view.tsx` |
| Badges pill en leyenda del gráfico de torta (Dashboard tablero) — dark-mode aware | MEDIUM | ✅ `dashboard-view.tsx` |
| `perStatusCounts` extraído de `statusCounts` en `workspace-dashboard.tsx` | MEDIUM | ✅ `workspace-dashboard.tsx` |
| Badges pill en leyenda del gráfico de torta (Dashboard workspace) — dark-mode aware | MEDIUM | ✅ `workspace-dashboard.tsx` |
| `frontend/Dockerfile.prod` multi-stage: `deps → builder (ARG NEXT_PUBLIC_API_URL) → runner` | HIGH | ✅ `frontend/Dockerfile.prod` |
| `next.config.mjs` añade `output: "standalone"` para soporte de imagen standalone | HIGH | ✅ `next.config.mjs` |
| `docker-compose.synology.yml` autocontenido (6 servicios, gunicorn, healthchecks) | HIGH | ✅ `docker-compose.synology.yml` |
| `.env.example` sección "Synology NAS / Self-hosted deploy" con variables comentadas | MEDIUM | ✅ `.env.example` |

**Notas técnicas:**
- Badges: `bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-100` — evita problema de contraste en dark mode
- `NEXT_PUBLIC_API_URL` se bake en el bundle cliente en build time → pasar como Docker `ARG`, no como env runtime
- `docker-compose.synology.yml` NO es overlay: es un compose completo independiente de `docker-compose.yml`

---

### SPRINT 10 — Google OAuth2 + Allowlist con Roles Pre-asignados ✅ COMPLETADO

**Objetivo:** Integrar autenticación SSO con Google (Google Workspace), controlada por una lista de acceso con roles pre-asignados. El login email+contraseña se mantiene como respaldo.

| Tarea | Prioridad | Estado |
|-------|-----------|--------|
| `backend/requirements.txt`: añadir `google-auth==2.36.0` | HIGH | ✅ |
| `User` model: campos `google_id` + `avatar_url` | HIGH | ✅ `accounts/models.py` |
| Modelo `AllowedEmail`: email/dominio + rol + invited_by + used_at | HIGH | ✅ `accounts/models.py` |
| Migración `0004_user_avatar_url_user_google_id_allowedemail` | HIGH | ✅ |
| `schemas.py`: `GoogleAuthSchema`, `AllowedEmailSchema`, `AllowedEmailCreateSchema`, update `UserSchema` | HIGH | ✅ `accounts/schemas.py` |
| `auth.py`: `verify_google_token()` con `google.oauth2.id_token` | HIGH | ✅ `accounts/auth.py` |
| `api.py`: `POST /auth/google` — valida token → allowlist → crea/actualiza user → JWT pair | HIGH | ✅ `accounts/api.py` |
| `api.py`: CRUD `/allowed-emails` (GET, POST, DELETE, POST /bulk) — solo administrador | HIGH | ✅ `accounts/api.py` |
| `settings/base.py`: `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | MEDIUM | ✅ |
| `.env.example`: sección Google OAuth2 con variables comentadas | MEDIUM | ✅ |
| Frontend: instalar `@react-oauth/google` | HIGH | ✅ |
| `providers.tsx`: `GoogleOAuthProvider` wrapper | HIGH | ✅ `lib/providers.tsx` |
| `types.ts`: `UserRole` type, actualizar `User` con role+avatar_url, añadir `AllowedEmail` | HIGH | ✅ `lib/types.ts` |
| `api.ts`: `googleAuth()`, `getAllowedEmails()`, `createAllowedEmail()`, `deleteAllowedEmail()`, `bulkCreateAllowedEmails()` | HIGH | ✅ `lib/api.ts` |
| `use-auth.ts`: `useGoogleAuth()` mutation | HIGH | ✅ `lib/hooks/use-auth.ts` |
| Login page: botón "Continuar con Google" con separador | HIGH | ✅ `app/login/page.tsx` |
| Panel `/admin/users`: CRUD allowlist para administradores | HIGH | ✅ `app/admin/users/page.tsx` |
| Sidebar: link "Control de Acceso" visible solo para administradores | MEDIUM | ✅ `components/sidebar/app-sidebar.tsx` |

**Notas técnicas:**
- Flujo: Frontend recibe `id_token` de Google → POST `/auth/google` → backend valida con `google-auth` library → busca en `AllowedEmail` (email exacto primero, luego dominio) → crea/actualiza `User` → retorna JWT pair
- Primer login Google: crea workspace default "Mi Primer Espacio" (misma lógica que registro email)
- Si usuario ya existía (registro por email/contraseña), actualiza `google_id` y `avatar_url`
- `AllowedEmail` soporta email específico O dominio completo (ej: `stwards.com` da acceso a todos los `@stwards.com`)
- Rol se toma del `AllowedEmail` al crear el usuario; no se cambia en logins posteriores
- `_require_admin(user)` helper centraliza la verificación de rol administrador en todos los endpoints
- `used_at` se marca la primera vez que el email/dominio es usado para registrarse

---

### SPRINT 11 — Deploy en Producción (Google Cloud) ✅ COMPLETADO

**Objetivo:** App accesible públicamente vía Firebase + Cloud Run + Neon PostgreSQL

**URLs producción:**
- Frontend: https://stward-task-1cbf3.web.app
- Backend: https://stward-backend-997565014222.us-central1.run.app

| Tarea | Prioridad | Estado |
|-------|-----------|--------|
| Next.js `output: "export"` para Firebase Hosting (static) | HIGH | ✅ |
| `generateStaticParams()` en rutas dinámicas | HIGH | ✅ |
| Firebase Hosting deploy + SPA rewrite | HIGH | ✅ |
| Docker build + push a GCR | HIGH | ✅ |
| Cloud Run deploy del backend | HIGH | ✅ |
| Neon PostgreSQL conectado + migraciones | HIGH | ✅ |
| `SECURE_PROXY_SSL_HEADER` en `production.py` | HIGH | ✅ |
| Env vars en Cloud Run (DJANGO_ENV, SECRET_KEY, DATABASE_URL, CORS, GOOGLE_CLIENT_ID, ALLOWED_HOSTS) | HIGH | ✅ |
| Fix loop infinito en frontend (pathname check + `enabled: isAuthenticated()`) | HIGH | ✅ |
| Google OAuth Client ID bakeado en build | HIGH | ✅ |
| Logout button en sidebar | MEDIUM | ✅ |
| Depurar error de login en producción | HIGH | ✅ |
| Crear superusuario `admin@stwards.com` en Neon | HIGH | ✅ (ya existía) |
| Verificar Google OAuth en producción | HIGH | ✅ |
| Celery/Beat workers en Cloud Run | MEDIUM | ✅ Cloud Run Job + Cloud Scheduler (ver abajo) |
| Fix: `send_assignment_notification.delay()` crash sin broker → try/except en `signals.py` | HIGH | ✅ `apps/projects/signals.py` |
| Fix: `send_task_moved_email.delay()` crash sin broker → try/except en `services.py` | HIGH | ✅ `apps/projects/services.py` |
| Cloud Run Job `check-overdue-tasks` + Cloud Scheduler (00:05 America/Guatemala) | HIGH | ✅ Cloud Run Jobs panel |
| Management command `check_overdue_tasks` (invoca la función sincrónicamente, sin broker) | MEDIUM | ✅ `apps/projects/management/commands/check_overdue_tasks.py` |
| Fix: DELETE/PUT falla con ERR_CONNECTION_RESET → `--min-instances=1` en `stward-backend` | HIGH | ✅ Cloud Run config |
| Fix: `fetchNoContent` retry en error de red (rotación de instancia Cloud Run) | MEDIUM | ✅ `lib/api.ts` |
| Fix botón "Nuevo espacio de trabajo" invisible en modo claro → `variant="ghost"` | LOW | ✅ `components/sidebar/create-workspace-dialog.tsx` |
| Fix: React hydration #418/#423 — NO usar `if (isLoading) return skeleton` a nivel de page | HIGH | ✅ varios pages |
| Fix: Firebase routing rutas dinámicas (`/board/**`, `/workspace/**`) → rewrites específicos en `firebase.json` | HIGH | ✅ `firebase.json` |
| Migrar frontend de Firebase static export → Cloud Run SSR (`stward-frontend`) | HIGH | ✅ Cloud Run + Docker |

**Notas técnicas:**
- `--set-env-vars` REEMPLAZA todo → siempre usar `--update-env-vars`
- `ALLOWED_HOSTS` debe incluir el dominio de Cloud Run
- `NEXT_PUBLIC_*` se bake en build time → rebuild si cambian
- `gcloud` no está en PATH de VS Code → usar Google Cloud SDK Shell
- `base.py` lee `DB_HOST`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` individualmente — Cloud Run necesita estas vars, NO solo `DATABASE_URL`
- `config/celery.py` tiene `setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")` → agregar `DJANGO_SETTINGS_MODULE=config.settings` explícitamente en Cloud Run
- `ALLOWED_HOSTS` se puede corromper con artefactos de Windows CMD si se configura desde cmd.exe — siempre verificar con `gcloud run services describe`
- Firebase CLI necesita `npm install -g firebase-tools` y reiniciar terminal, o usar ruta completa `C:\Users\...\AppData\Roaming\npm\firebase.cmd`
- Celery Beat **NO** se usa en Cloud Run (sin Redis). Reemplazado por Cloud Run Job + Cloud Scheduler. En local (Docker Compose) sigue usando Celery Beat.
- `min-instances=1` en `stward-backend` evita rotación de instancias durante sesiones activas (sin esto, Cloud Run rota instancias y corta conexiones TCP activas → DELETE/PUT fallan)

---

### SPRINT 12 — Visibilidad de Emails y Nombres en Colaboradores ⏳ PENDIENTE

**Objetivo:** Mostrar el nombre o email de cada colaborador en las tarjetas de tarea, subtareas y en la lista de pre-registrados, para facilitar la identificación en equipos con múltiples usuarios.

| Tarea | Prioridad | Estado |
|-------|-----------|--------|
| `AllowedEmail` model: añadir campo `name` opcional (nombre del usuario pre-registrado) | HIGH | ⏳ |
| Migración DB para `AllowedEmail.name` | HIGH | ⏳ |
| `AllowedEmailSchema` / `AllowedEmailCreateSchema`: exponer campo `name` | MEDIUM | ⏳ |
| Panel `/admin/users`: campo "Nombre" en formulario de agregar + columna "Nombre" en tabla | MEDIUM | ⏳ |
| CSV bulk import: soporte de columna `nombre` opcional (`email_o_dominio,rol,nombre`) | LOW | ⏳ |
| `TaskAssignment` / colaboradores: incluir `email` del usuario en la respuesta del backend | HIGH | ⏳ |
| `AssigneeSchema` en `schemas.py`: añadir campo `email` | HIGH | ⏳ |
| `Assignee` type en `types.ts`: añadir campo `email` | HIGH | ⏳ |
| Tarjetas Kanban: tooltip en avatar muestra `nombre (email)` | MEDIUM | ⏳ |
| Panel "Progreso por Colaborador" en `EditTaskDialog`: mostrar `nombre (email)` en lugar de solo nombre | HIGH | ⏳ |
| Subtareas: selector de colaborador muestra `nombre (email)` | MEDIUM | ⏳ |
| Panel "Carga del Equipo" en Dashboard: columna "Usuario" muestra email como subtítulo | LOW | ⏳ |

**Impacto:** Solo frontend + backend schemas/serializers. Sin cambio de flujo de autenticación.

---

## 5. DECISIONES ARQUITECTÓNICAS PENDIENTES (ADRs)

### ADR-001: Estrategia de Autenticación ✅ RESUELTO
**Decisión:** JWT stateless con PyJWT (no DRF/simplejwt)
- Access token: 30 min, Refresh token: 7 días
- Implementado en `backend/apps/accounts/auth.py`

### ADR-002: Migración de Next.js 14 → 15 ✅ RESUELTO
**Decisión:** Mantener Next.js 14 y Tailwind 3 — migrar después de estabilizar

### ADR-003: Mantenimiento del campo `assignee_name` ✅ RESUELTO
**Decisión:** Dual assignee — FK `assignee` para registrados + `assignee_name` (text) para externos
- Single-tenant (un equipo por instancia)

### ADR-004: Tailwind CSS 3 → 4 ✅ RESUELTO
**Decisión:** Mantener Tailwind CSS 3 — migrar después de estabilizar

---

## 6. MÉTRICAS DE ÉXITO

| Métrica | Inicio | Post-Sprint 2 | Objetivo Final |
|---------|--------|---------------|----------------|
| Test coverage backend | 0% | ~96% (51 tests) | ≥ 80% ✅ |
| Test coverage frontend | 0% | 18 tests | ≥ 70% ✅ |
| Vulnerabilidades CRITICAL | 10 | 0 | 0 ✅ |
| Vulnerabilidades HIGH | 16 | ≤ 3 | 0 |
| CI pipeline | No existía | 7-job pipeline | ✅ |
| E2E tests | 0 | Playwright + POM | ✅ |
| Security scanning | No existía | Grype kill switch | ✅ |
| SBOM | No existía | Syft SPDX JSON | ✅ |
| Lighthouse Performance | N/A | Pendiente Sprint 3 | ≥ 90 |
| Lighthouse Accessibility | N/A | Pendiente Sprint 3 | ≥ 90 |

---

## 7. RESTRICCIONES Y SUPUESTOS

### Restricciones
- UI en español (es)
- PostgreSQL como única DB (no MongoDB, Redis solo para caché futuro)
- Docker Compose como orquestador (no Kubernetes por ahora)
- Monorepo (backend/ + frontend/)

### Supuestos
- Aplicación single-tenant (un equipo por instancia) — **confirmado**
- Sin requisitos de real-time por ahora (WebSockets futuro)
- Deploy target: VPS o cloud containers (no serverless)

---

> **✅ Sprints 0-11 completados y validados. Aplicación en producción (Firebase + Cloud Run + Neon) con Google OAuth2 SSO, allowlist, sistema colaborativo, notificaciones, emails, visibilidad por rol, auto-gestión de tareas vencidas y progreso automático por subtareas.**
>
> **Sprint 12 PENDIENTE:** Visibilidad de emails/nombres en colaboradores de tareas y subtareas + campo `name` en AllowedEmail.
>
> **Regla de documentación:** Cada feature nueva debe actualizar CLAUDE.md (Estado Actual) + SPEC.md (sprint) + MANUAL.md (usuario).
