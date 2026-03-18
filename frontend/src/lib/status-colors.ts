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
