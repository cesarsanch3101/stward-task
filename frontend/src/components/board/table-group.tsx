"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow } from "./table-row";
import { useCreateTask } from "@/lib/hooks/use-tasks";
import type { Column } from "@/lib/types";

interface Props {
  column: Column;
  boardId: string;
  editingCell: { taskId: string; field: string } | null;
  setEditingCell: (cell: { taskId: string; field: string } | null) => void;
}

export function TableGroup({
  column,
  boardId,
  editingCell,
  setEditingCell,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const createTask = useCreateTask(boardId);

  const handleAddItem = () => {
    createTask.mutate({
      title: "Nueva tarea",
      column_id: column.id,
      priority: "none",
      progress: 0,
    });
  };

  return (
    <div className="mb-4">
      {/* Group header */}
      <button
        type="button"
        className="flex w-full cursor-pointer select-none items-center gap-2 rounded-t-md px-3 py-2 text-left"
        style={{
          backgroundColor: `${column.color}15`,
          borderLeft: `4px solid ${column.color}`,
        }}
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        aria-controls={`group-${column.id}`}
      >
        {collapsed ? (
          <ChevronRight
            className="h-4 w-4 shrink-0"
            style={{ color: column.color }}
            aria-hidden="true"
          />
        ) : (
          <ChevronDown
            className="h-4 w-4 shrink-0"
            style={{ color: column.color }}
            aria-hidden="true"
          />
        )}
        <span
          className="text-sm font-semibold"
          style={{ color: column.color }}
        >
          {column.name}
        </span>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-400">
          {column.tasks.length}
        </span>
      </button>

      {/* Rows */}
      {!collapsed && (
        <div id={`group-${column.id}`}>
          {column.tasks.map((task) => (
            <TableRow
              key={task.id}
              task={task}
              column={column}
              boardId={boardId}
              editingCell={editingCell}
              setEditingCell={setEditingCell}
            />
          ))}
          {/* Add item row */}
          <div
            className="flex items-center gap-2 border-b border-slate-100 px-3 py-1.5"
            style={{ borderLeft: `4px solid ${column.color}30` }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 text-xs text-slate-400 hover:text-slate-600"
              onClick={handleAddItem}
              disabled={createTask.isPending}
            >
              <Plus className="h-3 w-3" />
              Agregar elemento
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
