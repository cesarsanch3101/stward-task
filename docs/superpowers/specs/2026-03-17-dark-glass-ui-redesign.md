# UI Redesign — Dark Glass Premium
**Fecha:** 2026-03-17
**Estado:** Aprobado por usuario

## Objetivo
Transformar la interfaz visual de Stward Task de un estilo Monday.com corporativo conservador a un estilo **Dark Glass Premium**: fondo oscuro profundo, tarjetas con glassmorphism, gradientes indigo/violeta, tipografía más expresiva. El toggle dark/light se conserva. Solo prueba local primero — sin deploy hasta validación.

---

## Dirección Visual

| Elemento | Antes | Después |
|----------|-------|---------|
| Fondo dark body | `#1a2332` sólido | `linear-gradient(135deg, #0f0c29, #302b63, #24243e)` directo en `body` |
| Color primario | `#0073ea` (Monday Blue) | `#6366f1` (Indigo) |
| Color primario gradiente | — | `#6366f1 → #8b5cf6` en botones y acentos |
| Border radius base (`--radius`) | `0.25rem` (4px) | `0.625rem` (10px) — afecta inputs, badges |
| Border radius cards | 4px | `1rem` (16px) via `rounded-2xl` en JSX |
| Card background dark | sólido `#1a1a2e` | `rgba(255,255,255,0.07)` + `backdrop-filter: blur(10px)` |
| Card border dark | borde sólido | `1px solid rgba(255,255,255,0.12)` |
| Sidebar background | `#292f4c` | `#0f0c29` |

---

## Paleta de Colores

### Dark mode
- **Body background:** `linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)` — aplicado directo en CSS, no como token Tailwind
- **`--background` (token HSL):** `229 41% 8%` (fallback sólido para shadcn/ui internals: `#0d0f1f`)
- **Surface glass:** `rgba(255,255,255,0.07)` + `backdrop-filter: blur(10px)` + `border: 1px solid rgba(255,255,255,0.12)`
- **Surface hover:** `rgba(255,255,255,0.10)`
- **`--primary` (token HSL):** `239 84% 67%` → `#6366f1`
- **Texto primario:** `white`
- **Texto secundario:** `rgba(255,255,255,0.5)`
- **Texto muted:** `rgba(255,255,255,0.35)`

### Mapa de colores de estado (actualizado para dark glass)
Para `status-colors.ts` y columnas kanban:
- **Pendiente:** dot `#6366f1`, badge `rgba(99,102,241,0.25)` border `rgba(99,102,241,0.4)`
- **En Progreso:** dot `#f59e0b`, badge `rgba(245,158,11,0.25)` border `rgba(245,158,11,0.4)`
- **Retrasado:** dot `#ef4444`, badge `rgba(239,68,68,0.25)` border `rgba(239,68,68,0.4)`
- **Completado:** dot `#10b981`, badge `rgba(16,185,129,0.2)` border `rgba(16,185,129,0.35)`

### Mapa Recharts `<Cell fill>` (nuevo)
- Pendiente: `#6366f1`
- En Progreso: `#f59e0b`
- Retrasado: `#ef4444`
- Completado: `#10b981`

### Light mode (ajustado)
- **Fondo:** `#f8fafc` (sin gradiente)
- **Surface:** `white` con `box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)`
- **`--primary`:** `239 84% 67%` (mismo indigo)
- **Border:** `#e2e8f0`

---

## Estrategia de implementación de tokens

**CRÍTICO — incompatibilidad HSL:** `globals.css` almacena todos los tokens como triples HSL (`222 47% 11%`) consumidos como `hsl(var(--token))` en Tailwind. No se pueden asignar valores `rgba(...)` o `linear-gradient(...)` a estos tokens.

**Regla:** Los tokens existentes (`--background`, `--card`, `--primary`, etc.) se actualizan solo con valores HSL compatibles. Los efectos glass (blur, transparencias, gradiente de body) se aplican mediante:
1. CSS directo en `globals.css` en la regla `.dark body { background: gradient }`
2. Clases utilitarias nuevas en Tailwind para glass surfaces
3. Clases inline en JSX donde sea necesario (`rounded-2xl`, etc.)

---

## Componentes a Actualizar

### 1. `globals.css`
- Actualizar `--primary` y `--primary-foreground` a HSL de indigo `239 84% 67%`
- Actualizar `--background` dark a `229 41% 8%` (fallback sólido)
- Actualizar `--radius` de `0.25rem` a `0.625rem`
- Actualizar `--monday-sidebar` a nuevo valor `#0f0c29` (o renombrar a `--sidebar-bg`)
- Añadir regla directa: `.dark body { background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%) fixed; }`
- Confirmar que `@media print { body { background: white } }` sigue presente y tiene mayor especificidad
- Añadir clases utilitarias glass: `.glass-card { background: rgba(255,255,255,0.07); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.12); }`

### 2. `tailwind.config.ts`
- Actualizar `--radius` cascade: `lg = 10px`, `md = 8px`, `sm = 6px`
- Añadir `borderRadius: { '2xl': '1rem', '3xl': '1.5rem' }` para cards
- Actualizar color `monday-sidebar` a `#0f0c29`
- Añadir colores `glass` y `glass-border` como utilidades opcionales

### 3. Login Page (`app/login/page.tsx`)
- Fondo: `min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]` (independiente del body token)
- Card: `rounded-2xl glass-card` (o clases equivalentes inline)
- Logo: `<Image src="/logo-stward.png" />` con clase `dark:invert` (Tailwind built-in)
- Labels: `text-xs font-semibold uppercase tracking-widest text-white/50`
- Inputs: `bg-white/[0.06] border border-white/10 rounded-xl text-white/80`
- Botón primario: `bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_4px_20px_rgba(99,102,241,0.4)]`
- Botón Google: `bg-white/[0.06] border border-white/10 hover:bg-white/10`

### 4. Task Cards (`components/board/task-card.tsx`)
- Cambiar `rounded` a `rounded-2xl`
- Dark: añadir `dark:bg-white/[0.05] dark:backdrop-blur-[10px] dark:border-white/10`
- **Fix backdrop-filter:** El parent `KanbanColumn` usa framer-motion con `transform`. Añadir `isolation-isolate` en el wrapper de la tarjeta para que `backdrop-filter` funcione correctamente
- Badges prioridad: actualizar a colored glass según mapa de colores de estado
- Barra de progreso: `bg-gradient-to-r from-indigo-500 to-violet-400`

### 5. Columnas Kanban (columna header)
- Dot de color: actualizar hex según mapa de estados
- Label: `text-xs font-semibold uppercase tracking-wider`
- Pill contador: `bg-indigo-500/20 border border-indigo-400/30 text-indigo-300`

### 6. `status-colors.ts` (`lib/status-colors.ts`)
- Actualizar `STATUS_BG` con nuevos hex para dark glass (ver mapa de colores arriba)
- Añadir variante dark si el mapa light/dark difiere

### 7. Dashboard KPIs (`components/board/dashboard-view.tsx` + `workspace/workspace-dashboard.tsx`)
- KPI cards: fondo colored glass por tipo (indigo para total, verde para completadas, amber para retrasadas)
- Números: `bg-gradient-to-r from-indigo-400 to-violet-300 bg-clip-text text-transparent` en dark
- Recharts `<Cell fill>`: usar mapa de colores Recharts definido arriba

### 8. Gantt (`components/workspace/workspace-gantt.tsx`)
- Actualizar colores de barras al nuevo sistema de paleta

### 9. Sidebar (`components/sidebar/app-sidebar.tsx`)
- Cambiar `bg-monday-sidebar` a `bg-[#0f0c29]` o actualizar el token CSS
- Workspace activo: `bg-indigo-500/20 border border-indigo-400/20`
- Board hover: `hover:bg-indigo-500/10`

### 10. `ui/dialog.tsx` — DialogContent
- Añadir `dark:glass-card dark:rounded-2xl` o equivalente
- Afecta: `EditTaskDialog`, `CreateTaskDialog`, `CreateWorkspaceDialog`, modales de admin

### 11. `ui/dropdown-menu.tsx` + `ui/alert-dialog.tsx`
- DropdownMenu content: `dark:bg-[#1a1030] dark:border-white/10`
- AlertDialog: misma estrategia que DialogContent

### 12. Sonner Toasts (`lib/providers.tsx` — `<Toaster>`)
- Pasar `toastOptions={{ classNames: { toast: 'dark:!bg-[#1a1030] dark:!border-white/10 dark:!text-white' } }}`

### 13. `priority-badge.tsx`
- Reemplazar clases `bg-blue-100 text-blue-700` por variantes dark glass
- Usar formato: `bg-[color]/20 border border-[color]/40 text-[color]-300 dark:...`

---

## Fallback `backdrop-filter`
Para navegadores sin soporte (Safari < 9, Android WebView antiguo):
- Fallback automático: si `backdrop-filter` no está soportado, el `background: rgba(255,255,255,0.07)` ya provee suficiente contraste sobre el fondo oscuro. No se requiere `@supports` adicional para este proyecto de uso corporativo interno.

---

## Lo que NO cambia
- Estructura de componentes y rutas
- Lógica de negocio y servicios
- Sistema de permisos y roles
- Layout general (sidebar + main content)
- Animaciones framer-motion (solo se añade `isolation-isolate` donde necesario)
- Stack tecnológico
- Tipografía Geist Sans

---

## Secuencia de prueba local
1. `docker compose up --build -d` con cambios
2. Verificar Login en `http://localhost:3000/login`
3. Verificar Kanban en un tablero con tareas
4. Verificar Dashboard del tablero
5. Verificar Dashboard del workspace
6. Verificar modo light (toggle)
7. Verificar que dialogs/modals/toasts lucen consistentes
8. Solo si todo está bien → deploy a producción
