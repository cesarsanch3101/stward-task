"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useCreateTask } from "@/lib/hooks/use-tasks";
import { taskSchema, type TaskFormData } from "@/lib/schemas";

interface Props {
  columnId: string;
  boardId: string;
}

export function CreateTaskDialog({ columnId, boardId }: Props) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateTask(boardId);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "none",
      assignee_name: "",
      start_date: "",
      end_date: "",
      progress: 0,
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(
      {
        title: data.title,
        description: data.description,
        column_id: columnId,
        priority: data.priority,
        assignee_name: data.assignee_name || undefined,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        progress: data.progress,
      },
      {
        onSuccess: () => {
          form.reset();
          setOpen(false);
        },
      }
    );
  });

  const progress = form.watch("progress");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-700">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="¿Qué hay que hacer?"
              {...form.register("title")}
              autoFocus
            />
            {form.formState.errors.title && (
              <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Detalles adicionales (opcional)"
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
              <Label htmlFor="create-assignee">Persona asignada</Label>
              <Input
                id="create-assignee"
                {...form.register("assignee_name")}
                placeholder="Nombre completo"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="create-start-date">Fecha de inicio</Label>
              <Input
                id="create-start-date"
                type="date"
                {...form.register("start_date")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="create-end-date">Fecha de finalización</Label>
              <Input
                id="create-end-date"
                type="date"
                {...form.register("end_date")}
              />
              {form.formState.errors.end_date && (
                <p className="text-xs text-red-500">{form.formState.errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="create-progress">
              Progreso: {progress}%
            </Label>
            <input
              id="create-progress"
              type="range"
              min={0}
              max={100}
              step={5}
              {...form.register("progress", { valueAsNumber: true })}
              title={`Progreso: ${progress}%`}
              className="w-full accent-blue-500"
            />
          </div>

          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creando..." : "Crear tarea"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
