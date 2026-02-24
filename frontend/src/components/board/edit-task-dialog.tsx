"use client";

import { useEffect, useState } from "react";
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
import { useBoard } from "@/lib/hooks/use-board";
import { useUsers } from "@/lib/hooks/use-users";
import { taskSchema, type TaskFormData } from "@/lib/schemas";
import { CommentSection } from "./comment-section";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Task } from "@/lib/types";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
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

  const boardQuery = useBoard(boardId);
  const usersQuery = useUsers();

  // Local state for individual assignment progress (keyed by user_id)
  const [assignmentProgress, setAssignmentProgress] = useState<Record<string, number>>(() =>
    Object.fromEntries((task.assignments || []).map((a) => [a.user.id, a.individual_progress]))
  );

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
          progress: data.progress,
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar tarea</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-description">Descripción</Label>
            <Textarea
              id="edit-description"
              {...form.register("description")}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label>Colaboradores</Label>
              <Controller
                control={form.control}
                name="assignee_ids"
                render={({ field }) => (
                  <div className="border rounded-md p-2 bg-muted/20">
                    <ScrollArea className="h-[100px]">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
              Progreso por Colaborador
            </Label>

            {task.assignments && task.assignments.length > 0 ? (
              <div className="space-y-4">
                {task.assignments.map((assignment) => (
                  <div key={assignment.id} className="space-y-2">
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
                        {assignment.individual_progress}%
                      </span>
                    </div>
                    {/* Note: In a real app we'd need a separate endpoint or field in schema to update individual progress */}
                    <div
                      className="h-1.5 w-full bg-muted rounded-full overflow-hidden"
                    >
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${assignment.individual_progress}%`,
                          backgroundColor: assignment.user_color
                        }}
                      />
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-border/50">
                  <div className="flex justify-between items-end mb-1">
                    <Label className="text-sm font-semibold">Progreso Total</Label>
                    <span className="text-lg font-bold text-primary">{task.total_progress}%</span>
                  </div>
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

          <CommentSection taskId={task.id} />

          <div className="flex justify-between pt-2">
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
