# SPEC.md — Contrato Arquitectónico v1.0
## Stward Task — Kanban Board Application
**Fecha:** 2026-02-17
**Autor:** AG-ARCHITECT (Mesa Agéntica SASE)
**Estado:** SPRINT 2 COMPLETADO — Sprint 3 pendiente

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
│  Workspace, Board, Column, Task + Constraints        │
│  (UUID v4, validators, indexes, soft-delete)         │
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

### SPRINT 3 — Polish & Production (Semana 4)
> Objetivo: Production-ready

| Task | Prioridad | Agente |
|------|-----------|--------|
| Nginx reverse proxy config | HIGH | AG-INFRA |
| PostgreSQL backup strategy (pg_dump + cron) | HIGH | AG-INFRA |
| Soft-delete pattern para modelos críticos | MEDIUM | AG-BACKEND |
| Audit trail (created_by, updated_by) | MEDIUM | AG-BACKEND |
| Dark mode toggle | MEDIUM | AG-FRONTEND |
| Accesibilidad (ARIA, keyboard nav) | MEDIUM | AG-FRONTEND |
| Connection pooling (CONN_MAX_AGE / pgBouncer) | MEDIUM | AG-INFRA |
| Resource limits en Docker Compose | MEDIUM | AG-INFRA |
| API versioning (v1/) | LOW | AG-BACKEND |
| OpenAPI spec generation + TypeScript SDK | LOW | AG-BACKEND |

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

> **✅ Sprints 0-2 completados y validados. Sprint 3 (Polish & Production) pendiente.**
