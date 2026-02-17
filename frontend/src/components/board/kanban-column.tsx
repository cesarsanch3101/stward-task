"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskCard } from "./task-card";
import { CreateTaskDialog } from "./create-task-dialog";
import type { Column, Task } from "@/lib/types";

interface Props {
  column: Column;
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export function KanbanColumn({
  column,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${column.id}`,
    data: { type: "column", column },
  });

  const taskIds = column.tasks.map((t) => t.id);

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pb-3">
        <h3 className="font-semibold text-sm text-slate-700">{column.name}</h3>
        <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
          {column.tasks.length}
        </span>
        <div className="ml-auto">
          <CreateTaskDialog columnId={column.id} onTaskCreated={onTaskCreated} />
        </div>
      </div>

      {/* Lista de tareas */}
      <ScrollArea className="flex-1">
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-2 min-h-[60px] rounded-lg p-1 transition-colors ${
            isOver ? "bg-blue-50" : ""
          }`}
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {column.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onTaskUpdated={onTaskUpdated}
                onTaskDeleted={onTaskDeleted}
              />
            ))}
          </SortableContext>
        </div>
      </ScrollArea>
    </div>
  );
}
