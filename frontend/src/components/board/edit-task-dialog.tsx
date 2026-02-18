"use client";

import { useEffect } from "react";
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
import { taskSchema, type TaskFormData } from "@/lib/schemas";
import type { Task } from "@/lib/types";

interface Props {
  task: Task;
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({ task, boardId, open, onOpenChange }: Props) {
  const updateMutation = useUpdateTask(boardId);
  const deleteMutation = useDeleteTask(boardId);

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
    },
  });

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
    });
  }, [task, form]);

  const onSubmit = form.handleSubmit((data) => {
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
      <DialogContent className="sm:max-w-lg">
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
            />
            {form.formState.errors.title && (
              <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
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
              <Label htmlFor="edit-assignee">Persona asignada</Label>
              <Input
                id="edit-assignee"
                {...form.register("assignee_name")}
                placeholder="Nombre completo"
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
              />
              {form.formState.errors.end_date && (
                <p className="text-xs text-red-500">{form.formState.errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-progress">
              Progreso: {progress}%
            </Label>
            <input
              id="edit-progress"
              type="range"
              min={0}
              max={100}
              step={5}
              {...form.register("progress", { valueAsNumber: true })}
              title={`Progreso: ${progress}%`}
              className="w-full accent-blue-500"
            />
          </div>

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
