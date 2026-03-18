# Dark Glass Premium UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar la UI de Stward Task al estilo Dark Glass Premium — fondo oscuro profundo, glassmorphism, gradientes indigo/violeta — sin cambiar lógica de negocio ni estructura de componentes.

**Architecture:** Tokens-first: primero se actualizan CSS variables y tailwind.config, luego los componentes heredan los cambios base y se retocan con clases glass donde se necesite. Solo prueba local — no deploy hasta validación manual.

**Tech Stack:** Next.js 14, Tailwind CSS, shadcn/ui (Radix), framer-motion, Recharts, Sonner toasts, next-themes

---

## Archivo Map

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `frontend/src/app/globals.css` | Modificar | Tokens CSS, body gradient dark, clase `.glass-card` |
| `frontend/tailwind.config.ts` | Modificar | `--radius`, `borderRadius 2xl/3xl`, color `monday.sidebar` |
| `frontend/src/lib/status-colors.ts` | Modificar | Añadir `STATUS_BG_DARK` y `STATUS_TEXT_DARK` |
| `frontend/src/app/login/page.tsx` | Modificar | Rediseño completo dark glass + logo |
| `frontend/src/components/board/task-card.tsx` | Modificar | Glass effect, `rounded-2xl`, `isolation-isolate`, progress bar |
| `frontend/src/components/board/priority-badge.tsx` | Modificar | Dark glass badge classes |
| `frontend/src/components/board/kanban-column.tsx` | Modificar | Column header dots, pill contador |
| `frontend/src/components/board/dashboard-view.tsx` | Modificar | KPI glass cards, gradient numbers, Recharts colors |
| `frontend/src/components/workspace/workspace-dashboard.tsx` | Modificar | Mismo tratamiento que dashboard-view |
| `frontend/src/components/workspace/workspace-gantt.tsx` | Modificar | Colores barras Gantt |
| `frontend/src/components/sidebar/app-sidebar.tsx` | Modificar | Fondo `#0f0c29`, acentos indigo |
| `frontend/src/components/ui/dialog.tsx` | Modificar | Dark glass `DialogContent` |
| `frontend/src/components/ui/dropdown-menu.tsx` | Modificar | Dark glass DropdownMenuContent |
| `frontend/src/components/ui/alert-dialog.tsx` | Modificar | Dark glass AlertDialogContent |
| `frontend/src/lib/providers.tsx` | Modificar | Sonner dark glass `toastOptions` |

---

## Task 1: CSS Foundations — globals.css + tailwind.config.ts

**Files:**
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/tailwind.config.ts`

- [ ] **Step 1: Actualizar tokens dark en globals.css**

En `globals.css`, reemplazar el bloque `.dark { ... }` por:

```css
.dark {
  --background: 229 41% 8%;        /* fallback sólido #0d0f1f */
  --foreground: 210 40% 98%;
  --card: 229 41% 8%;
  --card-foreground: 210 40% 98%;
  --popover: 229 35% 10%;
  --popover-foreground: 210 40% 98%;
  --primary: 239 84% 67%;          /* indigo #6366f1 */
  --primary-foreground: 210 40% 98%;
  --secondary: 239 30% 18%;
  --secondary-foreground: 210 40% 98%;
  --muted: 239 30% 18%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 239 30% 18%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 239 30% 20%;
  --input: 239 30% 18%;
  --ring: 239 84% 67%;
}
```

- [ ] **Step 2: Actualizar `--primary` en light mode y `--radius`**

En el bloque `:root { ... }`, cambiar:
```css
--primary: 239 84% 67%;           /* indigo #6366f1 (era Monday Blue) */
--primary-foreground: 210 40% 98%;
--radius: 0.625rem;               /* 10px (era 0.25rem = 4px) */
--monday-sidebar: 231 57% 6%;     /* #0f0c29 (era #292f4c) */
```

- [ ] **Step 3: Añadir body gradient dark y clase .glass-card**

Al final de `globals.css`, antes del bloque `@media print`, agregar:

```css
/* ── Dark Glass Premium ── */
.dark body {
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%) fixed;
}

@layer utilities {
  .glass-card {
    background: rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  .glass-card-hover:hover {
    background: rgba(255, 255, 255, 0.10);
  }
}
```

- [ ] **Step 4: Actualizar tailwind.config.ts**

Añadir `2xl` y `3xl` al `borderRadius` y actualizar `monday.sidebar`:

```ts
borderRadius: {
  lg: 'var(--radius)',
  md: 'calc(var(--radius) - 2px)',
  sm: 'calc(var(--radius) - 4px)',
  '2xl': '1rem',
  '3xl': '1.5rem',
},
```

- [ ] **Step 5: Verificar visualmente**

```bash
cd frontend && npm run dev
```
Abre `http://localhost:3000`. Activa dark mode con el toggle.
Esperado: fondo del body cambia a gradiente oscuro profundo. Botones primarios ahora son indigo.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/globals.css frontend/tailwind.config.ts
git commit -m "style: dark glass tokens — indigo primary, gradient body, glass-card utility"
```

---

## Task 2: status-colors.ts — Añadir variantes dark glass

**Files:**
- Modify: `frontend/src/lib/status-colors.ts`

- [ ] **Step 1: Añadir exports dark al archivo**

Abrir `frontend/src/lib/status-colors.ts` y añadir al final:

```ts
/**
 * Colores glass para dark mode — rgba sobre fondo oscuro profundo.
 * Usar en componentes dentro de .dark cuando STATUS_BG da pasteles.
 */
export const STATUS_BG_DARK: Record<ColumnStatus, string> = {
  pending:     "rgba(99, 102, 241, 0.20)",   // indigo glass
  in_progress: "rgba(245, 158, 11, 0.20)",   // amber glass
  delayed:     "rgba(239, 68, 68, 0.20)",    // red glass
  completed:   "rgba(16, 185, 129, 0.18)",   // emerald glass
  custom:      "rgba(139, 92, 246, 0.20)",   // violet glass
};

export const STATUS_BORDER_DARK: Record<ColumnStatus, string> = {
  pending:     "rgba(99, 102, 241, 0.40)",
  in_progress: "rgba(245, 158, 11, 0.40)",
  delayed:     "rgba(239, 68, 68, 0.40)",
  completed:   "rgba(16, 185, 129, 0.35)",
  custom:      "rgba(139, 92, 246, 0.40)",
};

export const STATUS_DOT: Record<ColumnStatus, string> = {
  pending:     "#6366f1",
  in_progress: "#f59e0b",
  delayed:     "#ef4444",
  completed:   "#10b981",
  custom:      "#8b5cf6",
};

/** Colores hex para Recharts <Cell fill> — sólidos para SVG */
export const STATUS_CHART_COLOR: Record<ColumnStatus, string> = {
  pending:     "#6366f1",
  in_progress: "#f59e0b",
  delayed:     "#ef4444",
  completed:   "#10b981",
  custom:      "#8b5cf6",
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/status-colors.ts
git commit -m "style: add STATUS_BG_DARK, STATUS_BORDER_DARK, STATUS_DOT, STATUS_CHART_COLOR for glass theme"
```

---

## Task 3: Login Page — Dark Glass Redesign

**Files:**
- Modify: `frontend/src/app/login/page.tsx`

- [ ] **Step 1: Leer el archivo actual completo**

```bash
cat frontend/src/app/login/page.tsx
```

- [ ] **Step 2: Envolver la página en gradiente oscuro**

El componente raíz de la página debe quedar:
```tsx
<div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center p-4">
```
Eliminar cualquier clase `bg-zinc-*` o `bg-background` del wrapper raíz de login.

- [ ] **Step 3: Aplicar glass card al contenedor del formulario**

El `<Card>` o `<div>` que contiene el formulario:
```tsx
<div className="w-full max-w-md rounded-3xl p-8 shadow-2xl
  bg-white/[0.07] backdrop-blur-xl border border-white/[0.12]
  dark:bg-white/[0.07]">
```

- [ ] **Step 4: Reemplazar el elemento de logo existente**

El archivo ya tiene un `<Image src="/logo-stward.png">` con `dark:invert`. **Reemplazar ese elemento completo** por:
```tsx
<div className="flex flex-col items-center gap-2 mb-8">
  <Image
    src="/logo-stward.png"
    alt="Stward Corporation"
    width={180}
    height={48}
    className="invert brightness-200"
    priority
  />
  <p className="text-white/40 text-xs tracking-widest uppercase">
    Gestión de proyectos
  </p>
</div>
```
Asegurarse que `Image` de `next/image` esté importado.

- [ ] **Step 5: Actualizar estilos de inputs**

Para cada `<Input>` del formulario, añadir las clases:
```tsx
className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/30
           focus:border-indigo-400/50 focus:ring-indigo-400/20 rounded-xl"
```

- [ ] **Step 6: Actualizar labels**

Para cada `<Label>`:
```tsx
className="text-xs font-semibold uppercase tracking-widest text-white/50"
```

- [ ] **Step 7: Actualizar botón primario**

```tsx
className="w-full bg-gradient-to-r from-indigo-500 to-violet-500
           hover:from-indigo-600 hover:to-violet-600
           shadow-[0_4px_20px_rgba(99,102,241,0.4)]
           text-white font-semibold rounded-xl transition-all"
```

- [ ] **Step 8: Actualizar separador y botón Google**

Separador:
```tsx
<div className="flex items-center gap-3 my-4">
  <div className="flex-1 h-px bg-white/10" />
  <span className="text-white/30 text-xs">o continúa con</span>
  <div className="flex-1 h-px bg-white/10" />
</div>
```

Botón Google (wrapper del componente dinámico):
```tsx
<div className="flex justify-center">
  {/* componente GoogleLogin existente sin cambios */}
</div>
```

- [ ] **Step 9: Actualizar links de toggle (¿Ya tienes cuenta?)**

```tsx
className="text-indigo-400 hover:text-indigo-300 transition-colors"
```

- [ ] **Step 10: Verificar visualmente**

Ir a `http://localhost:3000/login` en dark mode.
Esperado: fondo gradiente oscuro, card glass, logo blanco, botón indigo con glow.
Verificar también en light mode — la página de login mantiene el gradiente oscuro (es intencional, el login siempre es dark).

- [ ] **Step 11: Commit**

```bash
git add frontend/src/app/login/page.tsx
git commit -m "style: login page dark glass redesign with corporate logo"
```

---

## Task 4: Task Cards — Glass Effect + Isolation Fix

**Files:**
- Modify: `frontend/src/components/board/task-card.tsx`

- [ ] **Step 1: Añadir glass effect y rounded-2xl al Card**

En `task-card.tsx`, la clase del `<Card>` principal (línea ~67) cambiar a:

```tsx
className={`
  ${canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
  rounded-2xl border shadow-none transition-all overflow-hidden
  hover:border-indigo-500/40 hover:shadow-[0_4px_20px_rgba(99,102,241,0.15)]
  dark:glass-card dark:hover:bg-white/[0.09]
  ${overdue
    ? "border-red-500/50 bg-red-50/30 dark:bg-red-500/[0.08] dark:border-red-500/30"
    : "bg-card"}
`}
```

- [ ] **Step 2: Añadir isolation-isolate al wrapper de setNodeRef**

El `<Card>` que recibe `ref={setNodeRef}` está dentro de framer-motion en la columna. En `task-card.tsx`, envolver el return completo con:

```tsx
<div style={{ isolation: "isolate" }}>
  <Card ...>
    ...
  </Card>
  <EditTaskDialog ... />
</div>
```

Esto rompe el stacking context del `transform` de framer-motion y permite que `backdrop-filter` funcione.

- [ ] **Step 3: Actualizar barra de progreso**

Buscar la barra de progreso en el CardContent. La barra interior (el fill) cambiar a:
```tsx
className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all"
```

- [ ] **Step 4: Verificar visualmente**

Abrir un tablero con tareas en dark mode.
Esperado: tarjetas con bordes redondeados, efecto glass, hover con glow indigo suave. Backdrop blur visible sobre el gradiente de fondo.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/board/task-card.tsx
git commit -m "style: task cards dark glass effect, rounded-2xl, isolation fix for backdrop-filter"
```

---

## Task 5: Priority Badge — Dark Glass Variant

**Files:**
- Modify: `frontend/src/components/board/priority-badge.tsx`

- [ ] **Step 1: Actualizar config de clases con variantes dark**

Reemplazar el objeto `config` completo:

```tsx
const config: Record<Priority, { label: string; className: string }> = {
  none:   { label: "Sin prioridad", className: "bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-white/10 dark:text-white/50 dark:hover:bg-white/10 dark:border-white/10" },
  low:    { label: "Baja",          className: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/25 dark:border-indigo-400/30" },
  medium: { label: "Media",         className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/25 dark:border-amber-400/30" },
  high:   { label: "Alta",          className: "bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-500/20 dark:text-orange-300 dark:hover:bg-orange-500/25 dark:border-orange-400/30" },
  urgent: { label: "Urgente",       className: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/25 dark:border-red-400/30" },
};
```

Añadir `border` al Badge para que el borde glass sea visible:
```tsx
<Badge variant="secondary" className={`border ${className} ${customClassName || ""}`}>
```

- [ ] **Step 2: Verificar**

Ver badges en tarjetas en dark mode. Esperado: pills colored glass, no pasteles sólidos.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/board/priority-badge.tsx
git commit -m "style: priority badges dark glass variants"
```

---

## Task 6: Kanban Column Headers

**Files:**
- Modify: `frontend/src/components/board/kanban-column.tsx` (o el componente que renderiza el header de columna)

- [ ] **Step 1: Leer el archivo para encontrar el header**

```bash
grep -n "column\|header\|status\|STATUS_BG" frontend/src/components/board/kanban-column.tsx | head -30
```

- [ ] **Step 2: Importar STATUS_DOT**

```tsx
import { STATUS_DOT } from "@/lib/status-colors";
```

- [ ] **Step 3: Actualizar el dot de color de columna**

Donde se renderiza el indicador de color del header, usar:
```tsx
<span
  className="w-2.5 h-2.5 rounded-full shrink-0"
  style={{ background: STATUS_DOT[column.status] ?? "#6366f1" }}
/>
```

- [ ] **Step 4: Actualizar el label de columna**

```tsx
<span className="text-xs font-semibold uppercase tracking-widest text-foreground/70">
  {column.name}
</span>
```

- [ ] **Step 5: Actualizar el pill contador de tareas**

```tsx
<span className="dark:bg-indigo-500/20 dark:border dark:border-indigo-400/30 dark:text-indigo-300
                 bg-secondary text-secondary-foreground
                 text-[10px] font-medium rounded-full px-2 py-0.5">
  {tasks.length}
</span>
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/board/kanban-column.tsx
git commit -m "style: kanban column headers with status dots and glass pill counters"
```

---

## Task 7: Dashboard Board Level

**Files:**
- Modify: `frontend/src/components/board/dashboard-view.tsx`

- [ ] **Step 1: Importar nuevos colores**

```tsx
import { STATUS_CHART_COLOR } from "@/lib/status-colors";
```

- [ ] **Step 2: Actualizar KPI cards**

Buscar los cards de KPI (Total, Completadas, En Progreso, etc.). Para cada card añadir clases dark glass:
```tsx
className="rounded-2xl border p-4
  dark:glass-card dark:border-white/10
  bg-card"
```

Para los números grandes de KPI, añadir gradient en dark:
```tsx
<p className="text-3xl font-black
  dark:bg-gradient-to-r dark:from-indigo-400 dark:to-violet-300
  dark:bg-clip-text dark:text-transparent
  text-foreground">
  {value}
</p>
```

- [ ] **Step 3: Actualizar colores Recharts**

Buscar los `<Cell fill={...}>` en el gráfico de torta. Reemplazar el array de colores hardcodeados por:
```tsx
// Antes del return, mapear el status al nuevo color:
const getChartColor = (status: string) =>
  STATUS_CHART_COLOR[status as ColumnStatus] ?? "#6366f1";

// En el Cell del pie chart:
<Cell key={`cell-${index}`} fill={getChartColor(entry.name)} />
```

Además, buscar el `<Bar>` del gráfico de carga del equipo (tiene `fill="#0073ea"` hardcodeado). Cambiar a:
```tsx
<Bar ... fill="#6366f1" />
```

- [ ] **Step 4: Verificar**

Abrir el Dashboard de un tablero en dark mode. KPIs con glass, números con gradiente, gráfico con colores vibrantes.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/board/dashboard-view.tsx
git commit -m "style: dashboard KPI glass cards and updated Recharts colors"
```

---

## Task 8: Workspace Dashboard + Gantt

**Files:**
- Modify: `frontend/src/components/workspace/workspace-dashboard.tsx`
- Modify: `frontend/src/components/workspace/workspace-gantt.tsx`

- [ ] **Step 1: workspace-dashboard.tsx — mismo tratamiento que dashboard-view**

Repetir Task 7 Steps 1-3 en `workspace-dashboard.tsx`. Los patrones son idénticos.

- [ ] **Step 2: workspace-gantt.tsx — actualizar colores de barras**

```bash
grep -n "fill\|color\|STATUS_BG\|chart" frontend/src/components/workspace/workspace-gantt.tsx | head -20
```

Reemplazar los colores de barras Gantt por `STATUS_CHART_COLOR` o los 8 colores rotativos que usa el Gantt por paleta indigo/violeta/emerald/amber:
```tsx
const GANTT_COLORS = [
  "#6366f1", "#8b5cf6", "#10b981", "#f59e0b",
  "#3b82f6", "#ec4899", "#14b8a6", "#f97316"
];
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/workspace/workspace-dashboard.tsx frontend/src/components/workspace/workspace-gantt.tsx
git commit -m "style: workspace dashboard glass and Gantt updated color palette"
```

---

## Task 9: Sidebar

**Files:**
- Modify: `frontend/src/components/sidebar/app-sidebar.tsx`

- [ ] **Step 1: Actualizar clase del fondo**

Buscar la clase `bg-monday-sidebar` en el `<aside>`. Cambiar por `bg-[#0f0c29]` (o dejar que el token CSS actualizado lo resuelva si ya usa `monday-sidebar`). Verificar que el token `--monday-sidebar` fue actualizado en Task 1.

- [ ] **Step 2: Workspace activo — acentos indigo**

Buscar la clase que se aplica al workspace activo/seleccionado. Actualizar a:
```tsx
// activo:
"bg-indigo-500/20 border border-indigo-400/20 text-white"
// hover:
"hover:bg-indigo-500/10 hover:text-white"
```

- [ ] **Step 3: Board activo/hover**

```tsx
// board activo:
"bg-indigo-500/15 text-white"
// board hover:
"hover:bg-indigo-500/10"
```

- [ ] **Step 4: Verificar**

Sidebar visible en dark mode con nuevo fondo más profundo y acentos indigo.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/sidebar/app-sidebar.tsx
git commit -m "style: sidebar deep dark background and indigo accent highlights"
```

---

## Task 10: UI Primitives — Dialog, Dropdown, AlertDialog

**Files:**
- Modify: `frontend/src/components/ui/dialog.tsx`
- Modify: `frontend/src/components/ui/dropdown-menu.tsx`
- Modify: `frontend/src/components/ui/alert-dialog.tsx`

- [ ] **Step 1: dialog.tsx — DialogContent**

En la línea del `className` de `DialogPrimitive.Content` (línea ~41), añadir al final del string de clases:
```
dark:bg-[#1a1030] dark:border-white/10 dark:shadow-[0_25px_50px_rgba(0,0,0,0.6)]
```
Y cambiar `sm:rounded-lg` por `sm:rounded-2xl`.

- [ ] **Step 2: dropdown-menu.tsx — DropdownMenuContent**

Buscar `DropdownMenuContent` y añadir a sus clases:
```
dark:bg-[#1a1030] dark:border-white/10
```

- [ ] **Step 3: alert-dialog.tsx — AlertDialogContent**

Mismo patrón que dialog.tsx:
```
dark:bg-[#1a1030] dark:border-white/10 dark:rounded-2xl
```

- [ ] **Step 4: Verificar**

Abrir EditTaskDialog, un DropdownMenu (⋯), y un AlertDialog de confirmación en dark mode. Todos deben tener fondo oscuro profundo coherente con el tema.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/dialog.tsx frontend/src/components/ui/dropdown-menu.tsx frontend/src/components/ui/alert-dialog.tsx
git commit -m "style: dark glass surfaces for dialog, dropdown, and alert-dialog"
```

---

## Task 11: Sonner Toasts

**Files:**
- Modify: `frontend/src/lib/providers.tsx`

- [ ] **Step 1: Actualizar ThemedToaster**

En `providers.tsx`, actualizar el componente `ThemedToaster`:

```tsx
function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      theme={(resolvedTheme as "light" | "dark") ?? "light"}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: "dark:!bg-[#1a1030] dark:!border-white/10 dark:!text-white dark:!rounded-2xl",
          description: "dark:!text-white/60",
          actionButton: "dark:!bg-indigo-500/20 dark:!text-indigo-300",
          cancelButton: "dark:!bg-white/10 dark:!text-white/60",
        },
      }}
    />
  );
}
```

- [ ] **Step 2: Verificar**

Ejecutar una acción que genere un toast (mover tarea, guardar cambio) en dark mode. El toast debe tener fondo dark glass.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/providers.tsx
git commit -m "style: sonner toasts dark glass theme"
```

---

## Task 12: Validación Visual Completa Local

- [ ] **Step 1: Levantar entorno local completo**

```bash
cd c:/Users/Cesar\ Sanchez/Documents/GitHub/stward-task
docker compose up --build -d
```

- [ ] **Step 2: Checklist dark mode**

Abrir `http://localhost:3000` y activar dark mode. Verificar cada pantalla:

| Pantalla | URL | Qué verificar |
|---------|-----|---------------|
| Login | `/login` | Gradiente, logo blanco, card glass, botón indigo |
| Dashboard tablero | `/board/[id]` (tab Dashboard) | KPI glass, gráfico colores nuevos |
| Kanban | `/board/[id]` (tab Kanban) | Cards glass, column headers con dots, progress gradient |
| Tabla | `/board/[id]` (tab Tabla) | Bordes redondeados, coherencia |
| Workspace | `/workspace/[id]` | Dashboard + Gantt colores nuevos |
| Sidebar | (siempre visible) | Fondo `#0f0c29`, acentos indigo |
| EditTaskDialog | Click en tarea | Fondo dark glass, no blanco sólido |
| Dropdown ⋯ | Hover sobre tablero/workspace | Fondo dark glass |
| Toast | Mover tarea o guardar | Fondo dark glass |

- [ ] **Step 3: Checklist light mode**

Activar light mode. Verificar que no se rompió nada:
- Tarjetas blancas con sombras suaves ✓
- Botones primarios ahora son indigo (no azul Monday) ✓
- Inputs y borders coherentes ✓
- Login: gradiente oscuro se mantiene en light mode (es correcto, intencional)

- [ ] **Step 4: Commit final de validación**

```bash
git add -A
git commit -m "style: dark glass premium UI complete — validated locally"
```

---

## Notas para el implementador

- **NO hacer deploy** hasta que el usuario valide visualmente en local
- Si `backdrop-filter` no se ve (blur no funciona), verificar que el wrapper tiene `isolation: isolate` (Task 4 Step 2)
- La clase `.glass-card` de Task 1 requiere que el elemento tenga un `background` semitransparente para que el blur sea visible sobre el gradiente del body
- El login page mantiene el gradiente oscuro incluso en light mode — es un diseño intencional
- `STATUS_BG` original se mantiene intacto para light mode; `STATUS_BG_DARK` se usa condicionalmente donde se necesite
