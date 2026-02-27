"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateTask, useDeleteTask } from "@/lib/hooks/use-tasks";
import { useBoard, boardKeys } from "@/lib/hooks/use-board";
import { useUsers } from "@/lib/hooks/use-users";
import * as api from "@/lib/api";
import { taskSchema, type TaskFormData } from "@/lib/schemas";
import { CommentSection } from "./comment-section";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Check, X, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { Task } from "@/lib/types";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

type SubtaskStatus = "pending" | "in_progress" | "delayed" | "completed";

const SUBTASK_STATUSES: {
  key: SubtaskStatus;
  label: string;
  progress: number;
  activeClass: string;
  barClass: string;
}[] = [
  { key: "pending",     label: "Pendiente",  progress: 0,   activeClass: "bg-gray-200 text-gray-700",     barClass: "bg-gray-400"   },
  { key: "in_progress", label: "En Proceso", progress: 50,  activeClass: "bg-blue-100 text-blue-700",     barClass: "bg-blue-500"   },
  { key: "delayed",     label: "Retrasado",  progress: 25,  activeClass: "bg-orange-100 text-orange-700", barClass: "bg-orange-500" },
  { key: "completed",   label: "Completado", progress: 100, activeClass: "bg-green-100 text-green-700",   barClass: "bg-green-500"  },
];

function progressToSubtaskStatus(progress: number): SubtaskStatus {
  if (progress === 0)   return "pending";
  if (progress === 100) return "completed";
  if (progress < 40)    return "delayed";
  return "in_progress";
}

interface Props {
  task: Task;
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({ task, boardId, open, onOpenChange }: Props) {
  const updateMutation = useUpdateTask(boardId);
  const deleteMutation = useDeleteTask(boardId);
  const queryClient = useQueryClient();

  const boardQuery = useBoard(boardId);
  const usersQuery = useUsers();

  // Local state for individual assignment progress (keyed by user_id)
  const [assignmentProgress, setAssignmentProgress] = useState<Record<string, number>>(() =>
    Object.fromEntries((task.assignments || []).map((a) => [a.user.id, a.individual_progress]))
  );

  // Subtask creation state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState<string>("");
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);

  const createSubtaskMutation = useMutation({
    mutationFn: () => {
      const firstColumnId = boardQuery.data?.columns[0]?.id ?? "";
      return api.createSubtask(firstColumnId, task.id, newSubtaskTitle, newSubtaskAssignee);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
      setNewSubtaskTitle("");
      setNewSubtaskAssignee("");
      setShowSubtaskForm(false);
    },
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: ({ subtaskId, progress }: { subtaskId: string; progress: number }) =>
      api.updateTask(subtaskId, { progress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });

  // Subtask inline editing
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editSubtaskTitle, setEditSubtaskTitle] = useState("");
  const [editSubtaskAssignee, setEditSubtaskAssignee] = useState<string>("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const startEditSubtask = (id: string, title: string, assigneeId: string) => {
    setEditingSubtaskId(id);
    setEditSubtaskTitle(title);
    setEditSubtaskAssignee(assigneeId);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const cancelEditSubtask = () => {
    setEditingSubtaskId(null);
    setEditSubtaskTitle("");
    setEditSubtaskAssignee("");
  };

  const editSubtaskMutation = useMutation({
    mutationFn: ({ subtaskId, title, assigneeId }: { subtaskId: string; title: string; assigneeId: string }) =>
      api.updateTask(subtaskId, {
        title,
        assignee_ids: assigneeId ? [assigneeId] : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
      cancelEditSubtask();
    },
  });

  // Subtask delete state
  const [deletingSubtaskId, setDeletingSubtaskId] = useState<string | null>(null);

  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId: string) => api.deleteTask(subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
      setDeletingSubtaskId(null);
    },
  });

  // Subtask reorder
  const reorderSubtaskMutation = useMutation({
    mutationFn: async ({ id, newOrder, adjacentId, adjacentOrder }: {
      id: string; newOrder: number; adjacentId: string; adjacentOrder: number;
    }) => {
      await api.updateTask(id, { order: newOrder });
      await api.updateTask(adjacentId, { order: adjacentOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      assignee_name: task.assignee_name ?? "",
      start_date: task.start_date ?? "",
      end_date: task.end_date ?? "",
      progress: task.progress,
      assignee_ids: task.assignments?.map(a => a.user.id) || [],
      parent_id: task.parent_id ?? null,
      dependency_ids: task.dependency_ids ?? [],
    },
  });

  // Sync assignment progress when task changes
  useEffect(() => {
    setAssignmentProgress(
      Object.fromEntries((task.assignments || []).map((a) => [a.user.id, a.individual_progress]))
    );
  }, [task]);

  // Sync form when task prop changes (fixes stale state bug F13)
  useEffect(() => {
    form.reset({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      assignee_name: task.assignee_name ?? "",
      start_date: task.start_date ?? "",
      end_date: task.end_date ?? "",
      progress: task.progress,
      assignee_ids: task.assignments?.map(a => a.user.id) || [],
      parent_id: task.parent_id ?? null,
      dependency_ids: task.dependency_ids ?? [],
    });
  }, [task, form.reset]);

  const onSubmit = form.handleSubmit((data) => {
    const ap = Object.entries(assignmentProgress).map(([user_id, progress]) => ({
      user_id,
      progress,
    }));
    const computedProgress =
      ap.length > 0
        ? Math.round(ap.reduce((sum, item) => sum + item.progress, 0) / ap.length)
        : data.progress;
    updateMutation.mutate(
      {
        id: task.id,
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          assignee_name: data.assignee_name || undefined,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          progress: computedProgress,
          assignee_ids: data.assignee_ids,
          parent_id: data.parent_id,
          dependency_ids: data.dependency_ids,
          assignment_progress: ap.length > 0 ? ap : undefined,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  });

  const handleDelete = () => {
    deleteMutation.mutate(task.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const progress = form.watch("progress");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] min-h-[75vh] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-border/50">
          <DialogTitle>Editar tarea</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          {/* ── Área de dos paneles ── */}
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {/* Panel izquierdo: campos principales */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 border-r border-border/50">

              {/* Título */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  {...form.register("title")}
                  autoFocus
                  aria-invalid={!!form.formState.errors.title}
                  aria-errormessage={form.formState.errors.title ? "error-edit-title" : undefined}
                />
                {form.formState.errors.title && (
                  <p id="error-edit-title" className="text-xs text-red-500" role="alert">{form.formState.errors.title.message}</p>
                )}
              </div>

              {/* Descripción */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  {...form.register("description")}
                  rows={3}
                />
              </div>

              {/* Prioridad + Fechas en 3 columnas */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-2">
                  <Label>Prioridad</Label>
                  <Controller
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
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
                    )}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-start-date">Fecha de inicio</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    {...form.register("start_date")}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-end-date">Fecha de finalización</Label>
                  <Input
                    id="edit-end-date"
                    type="date"
                    {...form.register("end_date")}
                    aria-invalid={!!form.formState.errors.end_date}
                    aria-errormessage={form.formState.errors.end_date ? "error-edit-end-date" : undefined}
                  />
                  {form.formState.errors.end_date && (
                    <p id="error-edit-end-date" className="text-xs text-red-500" role="alert">{form.formState.errors.end_date.message}</p>
                  )}
                </div>
              </div>

              {/* Colaboradores */}
              <div className="flex flex-col gap-2">
                <Label>Colaboradores</Label>
                <Controller
                  control={form.control}
                  name="assignee_ids"
                  render={({ field }) => (
                    <div className="border rounded-md p-2 bg-muted/20">
                      <ScrollArea className="h-[120px]">
                        <div className="space-y-2 pr-4">
                          {usersQuery.data?.map((member) => (
                            <div key={member.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`member-${member.id}`}
                                checked={field.value?.includes(member.id)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, member.id]);
                                  } else {
                                    field.onChange(current.filter((id) => id !== member.id));
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`member-${member.id}`}
                                className="flex items-center gap-2 cursor-pointer text-xs flex-1"
                              >
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[8px] bg-blue-100 text-blue-700">
                                    {getInitials(member.first_name || member.email)}
                                  </AvatarFallback>
                                </Avatar>
                                {member.first_name} {member.last_name}
                                <span className="text-[10px] text-muted-foreground ml-auto">
                                  {member.email}
                                </span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                />
              </div>

              {/* Tarea Padre + Dependencias */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Tarea Padre (Hito/Grupo)</Label>
                  <Controller
                    control={form.control}
                    name="parent_id"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? "none"}
                        onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Ninguna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ninguna</SelectItem>
                          {boardQuery.data?.columns.flatMap(c => c.tasks || [])
                            .filter(t => t.id !== task.id)
                            .map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Dependencias</Label>
                  <Controller
                    control={form.control}
                    name="dependency_ids"
                    render={({ field }) => (
                      <div className="border rounded-md p-2 bg-muted/20">
                        <ScrollArea className="h-[100px]">
                          <div className="space-y-2 pr-4">
                            {boardQuery.data?.columns.flatMap(c => c.tasks || [])
                              .filter(t => t.id !== task.id)
                              .map((t) => (
                                <div key={t.id} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`dep-${t.id}`}
                                    checked={field.value?.includes(t.id)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, t.id]);
                                      } else {
                                        field.onChange(current.filter((id) => id !== t.id));
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`dep-${t.id}`} className="text-xs truncate flex-1 cursor-pointer">
                                    {t.title}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  />
                </div>
              </div>

            </div>

            {/* Panel derecho: subtareas, progreso y comentarios */}
            <div className="w-[360px] shrink-0 overflow-y-auto px-5 py-4 space-y-5 bg-muted/5">

              {/* ── Subtareas ── */}
              <div className="flex flex-col gap-2 p-3 bg-muted/20 rounded-lg border border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Subtareas {task.subtasks?.length > 0 && `(${task.subtasks.length})`}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowSubtaskForm((v) => !v)}
                    aria-label="Agregar subtarea"
                  >
                    +
                  </Button>
                </div>

                {task.subtasks && task.subtasks.length > 0 ? (
                  <ul className="space-y-2">
                    {[...task.subtasks].sort((a, b) => a.order - b.order).map((st, idx, sorted) => {
                      const status = progressToSubtaskStatus(st.progress);
                      const cfg = SUBTASK_STATUSES.find((s) => s.key === status)!;
                      const isFirst = idx === 0;
                      const isLast = idx === sorted.length - 1;
                      return (
                        <li key={st.id} className="rounded-md border border-border/40 bg-background/50 p-2.5 space-y-2">
                          {editingSubtaskId === st.id ? (
                            /* ── Modo edición ── */
                            <div className="space-y-2">
                              <Input
                                ref={editInputRef}
                                value={editSubtaskTitle}
                                onChange={(e) => setEditSubtaskTitle(e.target.value)}
                                className="h-7 text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") editSubtaskMutation.mutate({ subtaskId: st.id, title: editSubtaskTitle, assigneeId: editSubtaskAssignee });
                                  if (e.key === "Escape") cancelEditSubtask();
                                }}
                              />
                              <select
                                className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs"
                                value={editSubtaskAssignee}
                                onChange={(e) => setEditSubtaskAssignee(e.target.value)}
                                aria-label="Asignado"
                              >
                                <option value="">Sin asignar</option>
                                {usersQuery.data?.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.first_name || u.email}
                                  </option>
                                ))}
                              </select>
                              <div className="flex gap-1 justify-end">
                                <Button
                                  type="button" size="sm" variant="ghost"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={cancelEditSubtask}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button" size="sm"
                                  className="h-6 w-6 p-0"
                                  disabled={!editSubtaskTitle.trim() || editSubtaskMutation.isPending}
                                  onClick={() => editSubtaskMutation.mutate({ subtaskId: st.id, title: editSubtaskTitle, assigneeId: editSubtaskAssignee })}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* ── Modo lectura ── */
                            <>
                              <div className="flex items-center justify-between gap-2">
                                {/* Flechas de reorden */}
                                <div className="flex flex-col shrink-0">
                                  <button
                                    type="button"
                                    disabled={isFirst || reorderSubtaskMutation.isPending}
                                    onClick={() => {
                                      const prev = sorted[idx - 1];
                                      reorderSubtaskMutation.mutate({ id: st.id, newOrder: prev.order, adjacentId: prev.id, adjacentOrder: st.order });
                                    }}
                                    className="h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-20 disabled:cursor-default"
                                    aria-label="Mover subtarea arriba"
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isLast || reorderSubtaskMutation.isPending}
                                    onClick={() => {
                                      const next = sorted[idx + 1];
                                      reorderSubtaskMutation.mutate({ id: st.id, newOrder: next.order, adjacentId: next.id, adjacentOrder: st.order });
                                    }}
                                    className="h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-20 disabled:cursor-default"
                                    aria-label="Mover subtarea abajo"
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </button>
                                </div>
                                <span className={`text-sm font-medium flex-1 truncate ${status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                  {st.title}
                                </span>
                                {deletingSubtaskId === st.id ? (
                                  /* ── Confirmación de eliminación ── */
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-[10px] text-destructive font-medium">¿Eliminar?</span>
                                    <button
                                      type="button"
                                      onClick={() => deleteSubtaskMutation.mutate(st.id)}
                                      disabled={deleteSubtaskMutation.isPending}
                                      className="h-5 w-5 flex items-center justify-center rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                      aria-label="Confirmar eliminación"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingSubtaskId(null)}
                                      className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                      aria-label="Cancelar eliminación"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 shrink-0">
                                    {st.assignee && (
                                      <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-[8px] bg-blue-100 text-blue-700">
                                          {getInitials(st.assignee.first_name || st.assignee.email)}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => startEditSubtask(st.id, st.title, st.assignee?.id ?? "")}
                                      className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                      aria-label="Editar subtarea"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingSubtaskId(st.id)}
                                      className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                      aria-label="Eliminar subtarea"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1">
                                {SUBTASK_STATUSES.map((s) => (
                                  <button
                                    key={s.key}
                                    type="button"
                                    onClick={() => updateSubtaskMutation.mutate({ subtaskId: st.id, progress: s.progress })}
                                    className={`flex-1 text-[10px] py-0.5 rounded-full font-medium transition-colors border ${
                                      status === s.key
                                        ? `${s.activeClass} border-transparent`
                                        : "bg-transparent text-muted-foreground border-border/50 hover:bg-muted/60"
                                    }`}
                                  >
                                    {s.label}
                                  </button>
                                ))}
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${cfg.barClass}`}
                                  style={{ width: `${st.progress}%` }}
                                />
                              </div>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">Sin subtareas aún.</p>
                )}

                {showSubtaskForm && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                    <Input
                      placeholder="Título de la subtarea"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-2">
                      <select
                        className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm"
                        value={newSubtaskAssignee}
                        onChange={(e) => setNewSubtaskAssignee(e.target.value)}
                        aria-label="Asignar subtarea a"
                      >
                        <option value="">Sin asignar</option>
                        {usersQuery.data?.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.first_name || u.email}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8"
                        disabled={!newSubtaskTitle.trim() || createSubtaskMutation.isPending}
                        onClick={() => createSubtaskMutation.mutate()}
                      >
                        {createSubtaskMutation.isPending ? "..." : "Crear"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => { setShowSubtaskForm(false); setNewSubtaskTitle(""); setNewSubtaskAssignee(""); }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Progreso por Colaborador ── */}
              <div className="flex flex-col gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                  Progreso por Colaborador
                </Label>

                {task.assignments && task.assignments.length > 0 ? (
                  <div className="space-y-4">
                    {task.assignments.map((assignment) => {
                      const current = assignmentProgress[assignment.user.id] ?? assignment.individual_progress;
                      return (
                        <div key={assignment.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback
                                  className="text-[10px] font-bold text-white"
                                  style={{ backgroundColor: assignment.user_color }}
                                >
                                  {getInitials(assignment.user.first_name || assignment.user.email)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {assignment.user.first_name || assignment.user.email}
                              </span>
                            </div>
                            <span className="text-xs font-bold" style={{ color: assignment.user_color }}>
                              {current}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={current}
                            aria-label={`Progreso de ${assignment.user.first_name || assignment.user.email}`}
                            onChange={(e) =>
                              setAssignmentProgress((prev) => ({
                                ...prev,
                                [assignment.user.id]: Number(e.target.value),
                              }))
                            }
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                            style={{ accentColor: assignment.user_color }}
                          />
                        </div>
                      );
                    })}

                    <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                      <Label className="text-sm font-semibold">Progreso Total</Label>
                      <span className="text-lg font-bold text-primary">
                        {Math.round(
                          Object.values(assignmentProgress).reduce((a, b) => a + b, 0) /
                            Math.max(Object.values(assignmentProgress).length, 1)
                        )}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="edit-progress" className="text-sm">
                      Progreso General: {progress}%
                    </Label>
                    <input
                      id="edit-progress"
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      {...form.register("progress", { valueAsNumber: true })}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                )}
              </div>

              {/* ── Comentarios ── */}
              <CommentSection taskId={task.id} />

            </div>
          </div>

          {/* ── Footer fijo ── */}
          <div className="flex justify-between items-center px-6 py-4 shrink-0 border-t border-border/50">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="sm">
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminará &quot;{task.title}&quot; permanentemente. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
