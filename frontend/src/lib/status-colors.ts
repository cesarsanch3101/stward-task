import type { ColumnStatus } from "./types";

/**
 * Colores de fondo pastel por estado semántico de columna.
 * Fuente única de verdad — usada en Kanban, Tabla, Dashboard y Gantt.
 */
export const STATUS_BG: Record<ColumnStatus, string> = {
  pending:     "#CBD5E1", // gris azulado  — Pendiente
  in_progress: "#FDE68A", // amarillo pastel — En Progreso
  delayed:     "#FCA5A5", // rojo pastel    — Retrasado
  completed:   "#86EFAC", // verde pastel   — Completado
  custom:      "#C4B5FD", // morado pastel  — Personalizado
};

/**
 * Colores de texto con buen contraste sobre cada fondo pastel.
 */
export const STATUS_TEXT: Record<ColumnStatus, string> = {
  pending:     "#475569",
  in_progress: "#92400E",
  delayed:     "#991B1B",
  completed:   "#166534",
  custom:      "#5B21B6",
};

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
