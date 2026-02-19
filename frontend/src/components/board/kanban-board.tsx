"use client";

import { useCallback, useEffect, useState } from "react";
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
import { AnimatePresence, motion } from "framer-motion";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import { useMoveTask } from "@/lib/hooks/use-tasks";
import type { Board, Column, Task } from "@/lib/types";

interface Props {
  board: Board;
}

export function KanbanBoard({ board }: Props) {
  const [columns, setColumns] = useState<Column[]>(board.columns);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const moveTaskMutation = useMoveTask(board.id);

  // Sync columns when board data changes from query cache
  useEffect(() => {
    setColumns(board.columns);
  }, [board.columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const col = findColumnByTaskId(active.id as string);
    const task = col?.tasks.find((t) => t.id === active.id);
    setActiveTask(task ?? null);
  };

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Compute the final columns state in one pass
    let finalColumnId: string | null = null;
    let finalOrder = 0;

    setColumns((prev) => {
      const sourceCol = prev.find((c) =>
        c.tasks.some((t) => t.id === activeId)
      );
      if (!sourceCol) return prev;

      const overColumnId = extractColumnId(overId);

      // Same-column reorder
      if (!overColumnId && sourceCol.tasks.some((t) => t.id === overId)) {
        const oldIndex = sourceCol.tasks.findIndex((t) => t.id === activeId);
        const newIndex = sourceCol.tasks.findIndex((t) => t.id === overId);

        if (oldIndex !== newIndex) {
          const updated = prev.map((col) =>
            col.id === sourceCol.id
              ? { ...col, tasks: arrayMove(col.tasks, oldIndex, newIndex) }
              : col
          );
          const col = updated.find((c) =>
            c.tasks.some((t) => t.id === activeId)
          );
          if (col) {
            finalColumnId = col.id;
            finalOrder = col.tasks.findIndex((t) => t.id === activeId);
          }
          return updated;
        }
      }

      // Cross-column move (already handled by handleDragOver, just read position)
      const currentCol = prev.find((c) =>
        c.tasks.some((t) => t.id === activeId)
      );
      if (currentCol) {
        finalColumnId = currentCol.id;
        finalOrder = currentCol.tasks.findIndex((t) => t.id === activeId);
      }
      return prev;
    });

    // Use a microtask to ensure setColumns has been processed
    queueMicrotask(() => {
      if (!finalColumnId) return;
      moveTaskMutation.mutate(
        { taskId: activeId, columnId: finalColumnId, newOrder: finalOrder },
        {
          onError: () => {
            setColumns(board.columns);
          },
        }
      );
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
        <AnimatePresence mode="popLayout">
          {columns.map((column) => (
            <motion.div
              key={column.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <KanbanColumn column={column} boardId={board.id} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} boardId={board.id} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
