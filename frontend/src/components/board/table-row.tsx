"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriorityBadge } from "./priority-badge";
import { StatusPill } from "./status-pill";
import { EditTaskDialog } from "./edit-task-dialog";
import { useUpdateTask, useDeleteTask } from "@/lib/hooks/use-tasks";
import { isOverdue, wasCompletedLate } from "@/lib/task-utils";
import type { Task, Column, Priority } from "@/lib/types";

interface Props {
  task: Task;
  column: Column;
  boardId: string;
  editingCell: { taskId: string; field: string } | null;
  setEditingCell: (cell: { taskId: string; field: string } | null) => void;
}

const GRID_COLS = "40px 1fr 140px 120px 140px 100px 100px 90px 80px";

export function TableRow({
  task,
  column,
  boardId,
  editingCell,
  setEditingCell,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [localProgress, setLocalProgress] = useState(task.progress);
  const updateTask = useUpdateTask(boardId);
  const deleteTask = useDeleteTask(boardId);
  const overdue = isOverdue(task);
  const completedLate = wasCompletedLate(task);
  const titleRef = useRef<HTMLInputElement>(null);

  const isEditing = (field: string) =>
    editingCell?.taskId === task.id && editingCell?.field === field;

  const startEdit = (field: string) =>
    setEditingCell({ taskId: task.id, field });

  const commitEdit = (field: string, value: unknown) => {
    updateTask.mutate({ id: task.id, data: { [field]: value } });
    setEditingCell(null);
  };

  useEffect(() => {
    if (isEditing("title") && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [editingCell]);

  useEffect(() => {
    setLocalProgress(task.progress);
  }, [task.progress]);

  const displayAssignees = () => {
    if (task.assignments && task.assignments.length > 0) {
      return (
        <div className="flex -space-x-1.5 overflow-hidden">
          {task.assignments.slice(0, 3).map((a) => (
            <div
              key={a.id}
              className="h-5 w-5 rounded-full border-1 border-background flex items-center justify-center text-[8px] font-bold text-white shadow-sm"
              style={{ backgroundColor: a.user_color }}
              title={a.user.email}
            >
              {(a.user.first_name?.[0] || a.user.email[0]).toUpperCase()}
            </div>
          ))}
          {task.assignments.length > 3 && (
            <div className="h-5 w-5 rounded-full bg-muted border-1 border-background flex items-center justify-center text-[8px] font-bold text-muted-foreground">
              +{task.assignments.length - 3}
            </div>
          )}
        </div>
      );
    }
    return (
      <span className="text-slate-400 text-xs">
        {task.assignee_name || task.assignee?.email || "—"}
      </span>
    );
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("es", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <>
      <div
        className="grid items-center border-b border-border/50 transition-colors hover:bg-muted/30"
        style={{ gridTemplateColumns: GRID_COLS }}
      >
        {/* Checkbox placeholder */}
        <div className="flex items-center justify-center px-2 h-full border-r border-border/30">
          <div className="h-4 w-4 rounded-sm border border-slate-300" />
        </div>

        {/* Title */}
        <div
          className="cursor-text truncate px-3 py-2 text-[13px] font-medium h-full flex items-center border-r border-border/30"
          onClick={() => startEdit("title")}
        >
          {isEditing("title") ? (
            <Input
              ref={titleRef}
              defaultValue={task.title}
              className="h-7 text-sm"
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== task.title) commitEdit("title", v);
                else setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v && v !== task.title) commitEdit("title", v);
                  else setEditingCell(null);
                }
                if (e.key === "Escape") setEditingCell(null);
              }}
            />
          ) : (
            <span className="text-foreground/90">{task.title}</span>
          )}
        </div>

        {/* Status */}
        <div className="p-0 h-full border-r border-border/30 flex flex-col">
          <StatusPill
            name={overdue ? "Retrasada" : column.name}
            status={overdue ? "delayed" : column.status}
          />
          {completedLate && (
            <div className="flex items-center justify-center gap-1 px-2 py-0.5 text-[9px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-t border-amber-200 dark:border-amber-800">
              ⏰ Completada tarde
            </div>
          )}
        </div>

        {/* Priority */}
        <div className="px-3 py-2">
          {isEditing("priority") ? (
            <Select
              defaultValue={task.priority}
              onValueChange={(v) => commitEdit("priority", v)}
              open
              onOpenChange={(open) => {
                if (!open) setEditingCell(null);
              }}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin prioridad</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div
              className="cursor-pointer"
              onClick={() => startEdit("priority")}
            >
              <PriorityBadge priority={task.priority as Priority} />
              {task.priority === "none" && (
                <span className="text-xs text-slate-400">—</span>
              )}
            </div>
          )}
        </div>

        {/* Assignee */}
        <div
          className="cursor-pointer px-3 py-2 flex items-center overflow-hidden border-r border-border/30 h-full"
          onClick={() => setEditOpen(true)}
        >
          {displayAssignees()}
        </div>

        {/* Start date */}
        <div className="px-2 py-2">
          {isEditing("start_date") ? (
            <Input
              type="date"
              defaultValue={task.start_date ?? ""}
              className="h-7 text-xs"
              autoFocus
              onBlur={(e) => {
                commitEdit("start_date", e.target.value || null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditingCell(null);
              }}
            />
          ) : (
            <span
              className="cursor-pointer text-xs text-slate-500"
              onClick={() => startEdit("start_date")}
            >
              {formatDate(task.start_date)}
            </span>
          )}
        </div>

        {/* End date */}
        <div className="px-2 py-2">
          {isEditing("end_date") ? (
            <Input
              type="date"
              defaultValue={task.end_date ?? ""}
              className="h-7 text-xs"
              autoFocus
              onBlur={(e) => {
                commitEdit("end_date", e.target.value || null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditingCell(null);
              }}
            />
          ) : (
            <span
              className="cursor-pointer text-xs text-slate-500"
              onClick={() => startEdit("end_date")}
            >
              {formatDate(task.end_date)}
            </span>
          )}
        </div>

        {/* Progress */}
        <div className="px-3 py-2 h-full border-r border-border/30">
          <div
            className="flex cursor-pointer items-center gap-2 h-full"
            onClick={() => startEdit("progress")}
          >
            <div className="flex-1 h-2 bg-muted/40 rounded-[2px] overflow-hidden flex gap-[1px] p-[0.5px]">
              {task.assignments && task.assignments.length > 0 ? (
                task.assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="h-full bg-muted/20 relative overflow-hidden"
                    style={{ width: `${100 / task.assignments.length}%` }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${assignment.individual_progress}%`,
                        backgroundColor: assignment.user_color
                      }}
                    />
                  </div>
                ))
              ) : (
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${task.progress}%` }}
                />
              )}
            </div>
            <span className="text-[10px] font-bold text-muted-foreground shrink-0 w-8 text-right">
              {task.assignments && task.assignments.length > 0 ? task.total_progress : task.progress}%
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 px-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5 text-slate-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => deleteTask.mutate(task.id)}
            disabled={deleteTask.isPending}
          >
            <Trash2 className="h-3.5 w-3.5 text-slate-400" />
          </Button>
        </div>
      </div>

      <EditTaskDialog
        task={task}
        boardId={boardId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
