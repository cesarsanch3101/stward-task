"use client";

import { LayoutGrid, Table2, PieChart, GanttChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores/ui-store";

export function ViewToggle() {
  const { boardView, setBoardView } = useUIStore();

  return (
    <div className="flex items-center gap-1 rounded border border-border/50 bg-muted/20 p-0.5" role="group" aria-label="Cambiar vista">
      <Button
        variant={boardView === "kanban" ? "secondary" : "ghost"}
        size="sm"
        className={`h-7 gap-1.5 px-3 rounded-sm text-xs font-semibold transition-all ${boardView === "kanban"
          ? "bg-white dark:bg-muted shadow-sm text-primary"
          : "text-muted-foreground hover:text-foreground"
          }`}
        onClick={() => setBoardView("kanban")}
        aria-pressed={boardView === "kanban"}
      >
        <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Tablero</span>
      </Button>
      <Button
        variant={boardView === "table" ? "secondary" : "ghost"}
        size="sm"
        className={`h-7 gap-1.5 px-3 rounded-sm text-xs font-semibold transition-all ${boardView === "table"
          ? "bg-white dark:bg-muted shadow-sm text-primary"
          : "text-muted-foreground hover:text-foreground"
          }`}
        onClick={() => setBoardView("table")}
        aria-pressed={boardView === "table"}
      >
        <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Tabla</span>
      </Button>
      <Button
        variant={boardView === "dashboard" ? "secondary" : "ghost"}
        size="sm"
        className={`h-7 gap-1.5 px-3 rounded-sm text-xs font-semibold transition-all ${boardView === "dashboard"
          ? "bg-white dark:bg-muted shadow-sm text-primary"
          : "text-muted-foreground hover:text-foreground"
          }`}
        onClick={() => setBoardView("dashboard")}
        aria-pressed={boardView === "dashboard"}
      >
        <PieChart className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Dashboard</span>
      </Button>
      <Button
        variant={boardView === "gantt" ? "secondary" : "ghost"}
        size="sm"
        className={`h-7 gap-1.5 px-3 rounded-sm text-xs font-semibold transition-all ${boardView === "gantt"
          ? "bg-white dark:bg-muted shadow-sm text-primary"
          : "text-muted-foreground hover:text-foreground"
          }`}
        onClick={() => setBoardView("gantt")}
        aria-pressed={boardView === "gantt"}
      >
        <GanttChart className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Gantt</span>
      </Button>
    </div>
  );
}
