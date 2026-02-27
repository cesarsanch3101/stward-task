import type { Task } from "@/lib/types";

/**
 * Exports a list of tasks as a CSV file.
 * Includes UTF-8 BOM so Excel opens it correctly.
 */
export function exportTasksCSV(tasks: Task[], filename: string) {
  const headers = [
    "Título",
    "Estado",
    "Prioridad",
    "Asignado",
    "Fecha inicio",
    "Fecha fin",
    "Progreso",
  ];

  const priorityLabel: Record<string, string> = {
    none: "Sin prioridad",
    low: "Baja",
    medium: "Media",
    high: "Alta",
    urgent: "Urgente",
  };

  const rows = tasks.map((t) => [
    t.title,
    t.assignee_name ?? "",
    priorityLabel[t.priority] ?? t.priority,
    t.assignments?.map((a) => `${a.user.first_name || a.user.email}`).join("; ") ?? "",
    t.start_date ?? "",
    t.end_date ?? "",
    `${t.progress}%`,
  ]);

  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
