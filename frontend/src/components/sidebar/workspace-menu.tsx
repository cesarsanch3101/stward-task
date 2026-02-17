"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  updateWorkspace,
  deleteWorkspace,
  createBoard,
} from "@/lib/api";
import type { Workspace, BoardSummary } from "@/lib/types";

interface Props {
  workspace: Workspace;
  onWorkspaceUpdated: (ws: Workspace) => void;
  onWorkspaceDeleted: (workspaceId: string) => void;
  onBoardCreated: (board: BoardSummary) => void;
}

export function WorkspaceMenu({
  workspace,
  onWorkspaceUpdated,
  onWorkspaceDeleted,
  onBoardCreated,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(workspace.name);
  const [editDesc, setEditDesc] = useState(workspace.description);
  const [editLoading, setEditLoading] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Create board state
  const [createOpen, setCreateOpen] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [boardDesc, setBoardDesc] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setEditLoading(true);
    try {
      const updated = await updateWorkspace(workspace.id, {
        name: editName.trim(),
        description: editDesc,
      });
      onWorkspaceUpdated({ ...workspace, ...updated, boards: workspace.boards });
      setEditOpen(false);
    } catch (err) {
      console.error("Error al actualizar espacio de trabajo:", err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteWorkspace(workspace.id);
      onWorkspaceDeleted(workspace.id);
      const viewingDeletedBoard = workspace.boards.some(
        (b) => pathname === `/board/${b.id}`
      );
      if (viewingDeletedBoard) {
        router.push("/");
      }
    } catch (err) {
      console.error("Error al eliminar espacio de trabajo:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName.trim()) return;
    setCreateLoading(true);
    try {
      const board = await createBoard({
        name: boardName.trim(),
        description: boardDesc,
        workspace_id: workspace.id,
      });
      onBoardCreated({
        id: board.id,
        name: board.name,
        description: board.description,
        workspace_id: board.workspace_id,
        created_at: board.created_at,
        updated_at: board.updated_at,
      });
      setBoardName("");
      setBoardDesc("");
      setCreateOpen(false);
      router.push(`/board/${board.id}`);
    } catch (err) {
      console.error("Error al crear tablero:", err);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-400 hover:text-slate-700"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={() => {
              setEditName(workspace.name);
              setEditDesc(workspace.description);
              setEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setBoardName("");
              setBoardDesc("");
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
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-edit-desc">Descripción (opcional)</Label>
              <Textarea
                id="ws-edit-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={editLoading || !editName.trim()}>
                {editLoading ? "Guardando..." : "Guardar"}
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
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="Ej: Sprint 1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-desc">Descripción (opcional)</Label>
              <Textarea
                id="board-desc"
                value={boardDesc}
                onChange={(e) => setBoardDesc(e.target.value)}
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
              <Button type="submit" disabled={createLoading || !boardName.trim()}>
                {createLoading ? "Creando..." : "Crear"}
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
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
