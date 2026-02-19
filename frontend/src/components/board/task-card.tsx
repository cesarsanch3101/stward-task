"use client";

import { memo, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarDays } from "lucide-react";
import { PriorityBadge } from "./priority-badge";
import { EditTaskDialog } from "./edit-task-dialog";
import type { Task } from "@/lib/types";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es", { day: "2-digit", month: "short" });
}

function isOverdue(task: Task): boolean {
  if (!task.end_date || task.progress >= 100) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(task.end_date + "T00:00:00");
  return end < today;
}

interface Props {
  task: Task;
  boardId: string;
  isOverlay?: boolean;
}

export const TaskCard = memo(function TaskCard({ task, boardId, isOverlay }: Props) {
  const [editOpen, setEditOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const overdue = isOverdue(task);

  return (
    <>
      <Card
        ref={isOverlay ? undefined : setNodeRef}
        style={isOverlay ? undefined : style}
        {...(isOverlay ? {} : attributes)}
        {...(isOverlay ? {} : listeners)}
        className={`cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${
          overdue ? "border-red-400 bg-red-50 dark:bg-red-950" : ""
        }`}
        tabIndex={0}
        aria-label={`${task.title}${task.priority !== "none" ? `, prioridad ${task.priority}` : ""}${overdue ? ", vencida" : ""}`}
        onClick={() => !isOverlay && setEditOpen(true)}
        onKeyDown={(e) => {
          if (!isOverlay && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setEditOpen(true);
          }
        }}
      >
        <CardHeader className="p-3 pb-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium leading-snug flex-1">{task.title}</p>
            {overdue && (
              <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold shrink-0">
                Vencida
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <PriorityBadge priority={task.priority} />
            {(task.assignee_name || task.assignee) && (
              <Avatar className="h-6 w-6" title={task.assignee_name || task.assignee?.email}>
                <AvatarFallback className="text-[10px] bg-muted">
                  {getInitials(task.assignee_name || task.assignee?.email || "")}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          {(task.start_date || task.end_date || task.progress > 0) && (
            <div className="space-y-1">
              {(task.start_date || task.end_date) && (
                <div className={`flex items-center gap-1 text-[11px] ${overdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}`}>
                  <CalendarDays className="h-3 w-3" />
                  {task.start_date && formatDate(task.start_date)}
                  {task.start_date && task.end_date && " \u2192 "}
                  {task.end_date && formatDate(task.end_date)}
                </div>
              )}
              {task.progress > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.min(task.progress, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {task.progress}%
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!isOverlay && (
        <EditTaskDialog
          task={task}
          boardId={boardId}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  );
});
