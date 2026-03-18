"use client";

import { memo } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskCard } from "./task-card";
import { CreateTaskDialog } from "./create-task-dialog";
import { STATUS_BG, STATUS_DOT } from "@/lib/status-colors";
import type { Column } from "@/lib/types";

interface Props {
  column: Column;
  boardId: string;
}

export const KanbanColumn = memo(function KanbanColumn({
  column,
  boardId,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${column.id}`,
    data: { type: "column", column },
  });

  const taskIds = column.tasks.map((t) => t.id);

  return (
    <div className="flex flex-col w-72 shrink-0" aria-label={`Columna: ${column.name} (${column.tasks.length} tareas)`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pb-3">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: STATUS_DOT[column.status] ?? "#6366f1" }}
        />
        <span className="text-xs font-semibold uppercase tracking-widest text-foreground/70">
          {column.name}
        </span>
        <span className="dark:bg-indigo-500/20 dark:border dark:border-indigo-400/30 dark:text-indigo-300
                 bg-secondary text-secondary-foreground
                 text-[10px] font-medium rounded-full px-2 py-0.5">
          {column.tasks.length}
        </span>
        <div className="ml-auto">
          <CreateTaskDialog columnId={column.id} boardId={boardId} />
        </div>
      </div>

      {/* Task list */}
      <ScrollArea className="flex-1">
        <div
          ref={setNodeRef}
          role="list"
          aria-label={`Tareas en ${column.name}`}
          className={`flex flex-col gap-2 min-h-[60px] rounded-lg p-1 transition-colors ${
            isOver ? "bg-blue-50 dark:bg-blue-950" : ""
          }`}
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <AnimatePresence mode="popLayout">
              {column.tasks.map((task) => (
                <motion.div
                  key={task.id}
                  role="listitem"
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <TaskCard task={task} boardId={boardId} />
                </motion.div>
              ))}
            </AnimatePresence>
          </SortableContext>
        </div>
      </ScrollArea>
    </div>
  );
});
