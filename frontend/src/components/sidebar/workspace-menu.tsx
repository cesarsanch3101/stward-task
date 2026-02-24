"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontal, Pencil, Trash2, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useUpdateWorkspace,
  useDeleteWorkspace,
} from "@/lib/hooks/use-workspaces";
import { useCreateBoard } from "@/lib/hooks/use-board";
import { workspaceSchema, boardSchema, type WorkspaceFormData, type BoardFormData } from "@/lib/schemas";
import type { Workspace } from "@/lib/types";

interface Props {
  workspace: Workspace;
}

export function WorkspaceMenu({ workspace }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const updateMutation = useUpdateWorkspace();
  const deleteMutation = useDeleteWorkspace();
  const createBoardMutation = useCreateBoard();

  const editForm = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: workspace.name, description: workspace.description || "" },
  });

  const boardForm = useForm<BoardFormData>({
    resolver: zodResolver(boardSchema),
    defaultValues: { name: "", description: "" },
  });

  const handleEdit = editForm.handleSubmit((data) => {
    updateMutation.mutate(
      { id: workspace.id, data },
      {
        onSuccess: () => setEditOpen(false),
      }
    );
  });

  const handleDelete = () => {
    deleteMutation.mutate(workspace.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        const viewingDeletedBoard = workspace.boards.some(
          (b) => pathname === `/board/${b.id}`
        );
        if (viewingDeletedBoard) router.push("/");
      },
    });
  };

  const handleCreateBoard = boardForm.handleSubmit((data) => {
    createBoardMutation.mutate(
      { ...data, workspace_id: workspace.id },
      {
        onSuccess: (board) => {
          boardForm.reset();
          setCreateOpen(false);
          router.push(`/board/${board.id}`);
        },
      }
    );
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={() => {
              editForm.reset({
                name: workspace.name,
                description: workspace.description || "",
              });
              setEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              boardForm.reset({ name: "", description: "" });
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo tablero
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar espacio de trabajo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ws-edit-name">Nombre</Label>
              <Input
                id="ws-edit-name"
                {...editForm.register("name")}
              />
              {editForm.formState.errors.name && (
                <p className="text-xs text-red-500">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-edit-desc">Descripción (opcional)</Label>
              <Textarea
                id="ws-edit-desc"
                {...editForm.register("description")}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Board Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear tablero</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBoard} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="board-name">Nombre</Label>
              <Input
                id="board-name"
                {...boardForm.register("name")}
                placeholder="Ej: Sprint 1"
              />
              {boardForm.formState.errors.name && (
                <p className="text-xs text-red-500">{boardForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-desc">Descripción (opcional)</Label>
              <Textarea
                id="board-desc"
                {...boardForm.register("description")}
                rows={2}
              />
            </div>
            <p className="text-xs text-slate-500">
              Se crearán automáticamente las columnas: Pendientes, Por Hacer, En
              Progreso y Hecho.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createBoardMutation.isPending}>
                {createBoardMutation.isPending ? "Creando..." : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar espacio de trabajo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente &quot;{workspace.name}&quot; con todos
              sus tableros, columnas y tareas. Esta acción no se puede deshacer.
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
    </>
  );
}
