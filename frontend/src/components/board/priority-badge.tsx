import { Badge } from "@/components/ui/badge";
import { Priority } from "@/lib/types";

const config: Record<Priority, { label: string; className: string }> = {
  none: { label: "Sin prioridad", className: "bg-gray-100 text-gray-600 hover:bg-gray-100" },
  low: { label: "Baja", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  medium: { label: "Media", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
  high: { label: "Alta", className: "bg-orange-100 text-orange-700 hover:bg-orange-100" },
  urgent: { label: "Urgente", className: "bg-red-100 text-red-700 hover:bg-red-100" },
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
    <Badge variant="secondary" className={`${className} ${customClassName || ""}`}>
      {label}
    </Badge>
  );
}
