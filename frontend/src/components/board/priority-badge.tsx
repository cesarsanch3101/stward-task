import { Badge } from "@/components/ui/badge";
import { Priority } from "@/lib/types";

const config: Record<Priority, { label: string; className: string }> = {
  none:   { label: "Sin prioridad", className: "bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-white/10 dark:text-white/50 dark:hover:bg-white/10 dark:border-white/10" },
  low:    { label: "Baja",          className: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/25 dark:border-indigo-400/30" },
  medium: { label: "Media",         className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/25 dark:border-amber-400/30" },
  high:   { label: "Alta",          className: "bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-500/20 dark:text-orange-300 dark:hover:bg-orange-500/25 dark:border-orange-400/30" },
  urgent: { label: "Urgente",       className: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/25 dark:border-red-400/30" },
};

export function PriorityBadge({
  priority,
  className: customClassName
}: {
  priority: Priority;
  className?: string;
}) {
  if (priority === "none") return null;
  const { label, className } = config[priority];
  return (
    <Badge variant="secondary" className={`border ${className} ${customClassName || ""}`}>
      {label}
    </Badge>
  );
}
