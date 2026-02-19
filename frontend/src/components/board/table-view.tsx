"use client";

import { useState } from "react";
import type { Board } from "@/lib/types";
import { TableGroup } from "./table-group";

interface Props {
  board: Board;
}

const GRID_COLS = "40px 1fr 140px 120px 140px 100px 100px 90px 80px";

export function TableView({ board }: Props) {
  const [editingCell, setEditingCell] = useState<{
    taskId: string;
    field: string;
  } | null>(null);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="min-w-[900px]">
        {/* Header row */}
        <div
          className="grid items-center border-b-2 border-slate-200 px-0 py-2 text-xs font-medium uppercase tracking-wider text-slate-500"
          style={{ gridTemplateColumns: GRID_COLS }}
        >
          <div className="px-2" />
          <div className="px-3">Título</div>
          <div className="px-3">Estado</div>
          <div className="px-3">Prioridad</div>
          <div className="px-3">Asignado</div>
          <div className="px-2">Inicio</div>
          <div className="px-2">Fin</div>
          <div className="px-2">Progreso</div>
          <div className="px-2">Acciones</div>
        </div>

        {/* Groups */}
        <div className="mt-2">
          {board.columns.map((column) => (
            <TableGroup
              key={column.id}
              column={column}
              boardId={board.id}
              editingCell={editingCell}
              setEditingCell={setEditingCell}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
