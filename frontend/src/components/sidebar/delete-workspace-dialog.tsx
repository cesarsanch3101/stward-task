"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
import { Trash2 } from "lucide-react";
import { deleteWorkspace } from "@/lib/api";

interface Props {
  workspaceId: string;
  workspaceName: string;
  boardIds: string[];
  onWorkspaceDeleted: (workspaceId: string) => void;
}

export function DeleteWorkspaceDialog({
  workspaceId,
  workspaceName,
  boardIds,
  onWorkspaceDeleted,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteWorkspace(workspaceId);
      onWorkspaceDeleted(workspaceId);
      // If we're viewing a board that belongs to this workspace, go home
      const viewingDeletedBoard = boardIds.some(
        (id) => pathname === `/board/${id}`
      );
      if (viewingDeletedBoard) {
        router.push("/");
      }
    } catch (err) {
      console.error("Error al eliminar espacio de trabajo:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
          title="Eliminar espacio de trabajo"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar espacio de trabajo?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará permanentemente &quot;{workspaceName}&quot; con todos
            sus tableros, columnas y tareas. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
