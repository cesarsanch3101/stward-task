"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Plus } from "lucide-react";
import { createBoard } from "@/lib/api";
import type { BoardSummary } from "@/lib/types";

interface Props {
  workspaceId: string;
  onBoardCreated: (board: BoardSummary) => void;
}

export function CreateBoardDialog({ workspaceId, onBoardCreated }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const board = await createBoard({
        name: name.trim(),
        description,
        workspace_id: workspaceId,
      });
      onBoardCreated({
        id: board.id,
        name: board.name,
        description: board.description,
        workspace_id: board.workspace_id,
        created_at: board.created_at,
        updated_at: board.updated_at,
      });
      setName("");
      setDescription("");
      setOpen(false);
      router.push(`/board/${board.id}`);
    } catch (err) {
      console.error("Error al crear tablero:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          title="Nuevo tablero"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear tablero</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="board-name">Nombre</Label>
            <Input
              id="board-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Sprint 1"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="board-desc">Descripción (opcional)</Label>
            <Textarea
              id="board-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el propósito de este tablero"
              rows={2}
            />
          </div>
          <p className="text-xs text-slate-500">
            Se crearán automáticamente las columnas: Pendientes, Por Hacer, En
            Progreso y Hecho.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Creando..." : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
