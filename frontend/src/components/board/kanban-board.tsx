"use client";

import { useCallback, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import { moveTask } from "@/lib/api";
import type { Board, Column, Task } from "@/lib/types";

interface Props {
  initialBoard: Board;
}

export function KanbanBoard({ initialBoard }: Props) {
  const [columns, setColumns] = useState<Column[]>(initialBoard.columns);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ── Helpers ────────────────────────────────────
  const findColumnByTaskId = useCallback(
    (taskId: string): Column | undefined =>
      columns.find((col) => col.tasks.some((t) => t.id === taskId)),
    [columns]
  );

  const extractColumnId = (id: string): string | null => {
    if (typeof id === "string" && id.startsWith("column:")) {
      return id.replace("column:", "");
    }
    return null;
  };

  // ── CRUD callbacks ─────────────────────────────
  const handleTaskCreated = useCallback((task: Task) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === task.column_id
          ? { ...col, tasks: [...col.tasks, task] }
          : col
      )
    );
  }, []);

  const handleTaskUpdated = useCallback((updated: Task) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
      }))
    );
  }, []);

  const handleTaskDeleted = useCallback((taskId: string) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      }))
    );
  }, []);

  // ── Drag start ─────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const col = findColumnByTaskId(active.id as string);
    const task = col?.tasks.find((t) => t.id === active.id);
    setActiveTask(task ?? null);
  };

  // ── Drag over (live preview while dragging) ────
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceCol = findColumnByTaskId(activeId);

    const overColumnId = extractColumnId(overId);
    const targetCol = overColumnId
      ? columns.find((c) => c.id === overColumnId)
      : findColumnByTaskId(overId);

    if (!sourceCol || !targetCol || sourceCol.id === targetCol.id) return;

    setColumns((prev) => {
      const sourceTasks = [...sourceCol.tasks];
      const targetTasks = [...targetCol.tasks];
      const taskIdx = sourceTasks.findIndex((t) => t.id === activeId);
      const [movedTask] = sourceTasks.splice(taskIdx, 1);

      const overTaskIdx = targetTasks.findIndex((t) => t.id === overId);
      const insertIdx = overTaskIdx >= 0 ? overTaskIdx : targetTasks.length;
      targetTasks.splice(insertIdx, 0, movedTask);

      return prev.map((col) => {
        if (col.id === sourceCol.id) return { ...col, tasks: sourceTasks };
        if (col.id === targetCol.id) return { ...col, tasks: targetTasks };
        return col;
      });
    });
  };

  // ── Drag end (commit reorder + API call) ───────
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCol = findColumnByTaskId(activeId);
    if (!activeCol) return;

    const overColumnId = extractColumnId(overId);
    if (!overColumnId && activeCol.tasks.some((t) => t.id === overId)) {
      const oldIndex = activeCol.tasks.findIndex((t) => t.id === activeId);
      const newIndex = activeCol.tasks.findIndex((t) => t.id === overId);

      if (oldIndex !== newIndex) {
        setColumns((prev) =>
          prev.map((col) =>
            col.id === activeCol.id
              ? { ...col, tasks: arrayMove(col.tasks, oldIndex, newIndex) }
              : col
          )
        );
      }
    }

    const finalCol = columns.find((c) =>
      c.tasks.some((t) => t.id === activeId)
    );
    if (!finalCol) return;
    const finalOrder = finalCol.tasks.findIndex((t) => t.id === activeId);

    moveTask(activeId, finalCol.id, finalOrder)
      .then((updatedTask) => {
        // Update task with server response (auto-dates, progress, etc.)
        setColumns((prev) =>
          prev.map((col) => ({
            ...col,
            tasks: col.tasks.map((t) =>
              t.id === updatedTask.id ? { ...t, ...updatedTask } : t
            ),
          }))
        );
      })
      .catch((err) => {
        console.error("Error al mover tarea:", err);
        setColumns(initialBoard.columns);
      });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 p-6 overflow-x-auto flex-1">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onTaskCreated={handleTaskCreated}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
