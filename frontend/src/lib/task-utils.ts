import type { Task } from "./types";

/** Tarea actualmente vencida: deadline pasó y no está completada */
export function isOverdue(task: Task): boolean {
  if (!task.end_date || task.progress >= 100) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.end_date + "T00:00:00") < today;
}

/** Tarea completada pero su deadline ya había pasado (completada tarde) */
export function wasCompletedLate(task: Task): boolean {
  if (!task.end_date || task.progress < 100) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.end_date + "T00:00:00") < today;
}

/** Días de retraso para tareas actualmente vencidas */
export function daysOverdue(task: Task): number {
  if (!task.end_date) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(task.end_date + "T00:00:00");
  return Math.max(0, Math.floor((today.getTime() - end.getTime()) / 86_400_000));
}
