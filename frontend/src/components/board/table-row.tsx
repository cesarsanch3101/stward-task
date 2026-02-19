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

  const displayAssignee =
    task.assignee_name ||
    (task.assignee
      ? `${task.assignee.first_name} ${task.assignee.last_name}`.trim() ||
        task.assignee.email
      : "—");

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
        className="grid items-center border-b border-slate-100 transition-colors hover:bg-slate-50"
        style={{ gridTemplateColumns: GRID_COLS }}
      >
        {/* Checkbox placeholder */}
        <div className="flex items-center justify-center px-2">
          <div className="h-4 w-4 rounded border border-slate-300" />
        </div>

        {/* Title */}
        <div
          className="cursor-text truncate px-3 py-2 text-sm"
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
            <span className="text-slate-700">{task.title}</span>
          )}
        </div>

        {/* Status */}
        <div className="px-3 py-2">
          <StatusPill name={column.name} color={column.color} />
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
          className="cursor-text truncate px-3 py-2 text-sm"
          onClick={() => startEdit("assignee_name")}
        >
          {isEditing("assignee_name") ? (
            <Input
              defaultValue={task.assignee_name ?? ""}
              className="h-7 text-sm"
              placeholder="Nombre"
              autoFocus
              onBlur={(e) => {
                commitEdit("assignee_name", e.target.value.trim() || undefined);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commitEdit(
                    "assignee_name",
                    (e.target as HTMLInputElement).value.trim() || undefined
                  );
                }
                if (e.key === "Escape") setEditingCell(null);
              }}
            />
          ) : (
            <span className="text-slate-600">{displayAssignee}</span>
          )}
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
        <div className="px-2 py-2">
          {isEditing("progress") ? (
            <div className="flex items-center gap-1">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={localProgress}
                className="w-full accent-blue-500"
                onChange={(e) => setLocalProgress(Number(e.target.value))}
                onMouseUp={() => commitEdit("progress", localProgress)}
                onTouchEnd={() => commitEdit("progress", localProgress)}
                autoFocus
              />
            </div>
          ) : (
            <div
              className="flex cursor-pointer items-center gap-1"
              onClick={() => startEdit("progress")}
            >
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400">
                {task.progress}%
              </span>
            </div>
          )}
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
