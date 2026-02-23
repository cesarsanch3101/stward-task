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
        className={`cursor-grab active:cursor-grabbing border shadow-none hover:border-primary/50 transition-colors ${overdue ? "border-red-500/50 bg-red-50/30 dark:bg-red-950/20" : "bg-card"
          }`}
        tabIndex={0}
        onClick={(e) => {
          if (!isDragging) {
            setEditOpen(true);
          }
        }}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-start gap-2">
            <p className="text-[14px] font-medium leading-tight flex-1 text-foreground/90">{task.title}</p>
            {overdue && (
              <span className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider shrink-0 mt-0.5">
                Vencida
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <PriorityBadge priority={task.priority} />
            </div>

            <div className="flex -space-x-2 overflow-hidden">
              {task.assignments && task.assignments.length > 0 ? (
                task.assignments.map((assignment) => (
                  <Avatar
                    key={assignment.id}
                    className="h-6 w-6 border-2 border-background shadow-sm ring-1 ring-black/5"
                    title={assignment.user.email}
                  >
                    <AvatarFallback
                      className="text-[10px] font-bold"
                      style={{ backgroundColor: assignment.user_color, color: 'white' }}
                    >
                      {getInitials(assignment.user.first_name || assignment.user.email)}
                    </AvatarFallback>
                  </Avatar>
                ))
              ) : (task.assignee_name || task.assignee) && (
                <Avatar className="h-6 w-6 border-2 border-background shadow-sm ring-1 ring-black/5" title={task.assignee_name || task.assignee?.email}>
                  <AvatarFallback className="text-[10px] bg-muted font-bold">
                    {getInitials(task.assignee_name || task.assignee?.email || "")}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>

          {(task.start_date || task.end_date || task.progress > 0 || (task.assignments && task.assignments.length > 0)) && (
            <div className="pt-2 border-t border-border/50 space-y-2">
              {(task.start_date || task.end_date) && (
                <div className={`flex items-center gap-1.5 text-[11px] ${overdue ? "text-red-600 dark:text-red-400 font-semibold" : "text-muted-foreground/80 font-medium"}`}>
                  <CalendarDays className="h-3 w-3 opacity-70" />
                  <span>
                    {task.start_date && formatDate(task.start_date)}
                    {task.start_date && task.end_date && " - "}
                    {task.end_date && formatDate(task.end_date)}
                  </span>
                </div>
              )}

              {/* Segmented Progress Bar (Battery Style) */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2.5 bg-muted/50 rounded-[2px] overflow-hidden flex gap-[2px] p-[1px]">
                  {task.assignments && task.assignments.length > 0 ? (
                    task.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="h-full bg-muted/30 rounded-[1px] relative overflow-hidden group"
                        style={{ width: `${100 / task.assignments.length}%` }}
                        title={`${assignment.user.email}: ${assignment.individual_progress}%`}
                      >
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${assignment.individual_progress}%`,
                            backgroundColor: assignment.user_color
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div
                      className="h-full bg-primary/60 rounded-[1px] transition-all duration-500"
                      style={{ width: `${task.progress}%` }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-bold text-muted-foreground shrink-0 w-8 text-right">
                  {task.assignments && task.assignments.length > 0 ? task.total_progress : task.progress}%
                </span>
              </div>
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
