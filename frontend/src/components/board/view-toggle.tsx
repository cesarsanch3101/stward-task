"use client";

import { LayoutGrid, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores/ui-store";

export function ViewToggle() {
  const { boardView, setBoardView } = useUIStore();

  return (
    <div className="flex items-center gap-1 rounded-md border bg-slate-100 p-0.5">
      <Button
        variant={boardView === "kanban" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 gap-1.5 px-2"
        onClick={() => setBoardView("kanban")}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span className="text-xs">Tablero</span>
      </Button>
      <Button
        variant={boardView === "table" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 gap-1.5 px-2"
        onClick={() => setBoardView("table")}
      >
        <Table2 className="h-3.5 w-3.5" />
        <span className="text-xs">Tabla</span>
      </Button>
    </div>
  );
}
