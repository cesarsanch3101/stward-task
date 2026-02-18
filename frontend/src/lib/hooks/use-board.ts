"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/lib/api";
import { workspaceKeys } from "./use-workspaces";
import type { BoardSummary, Workspace } from "@/lib/types";

export const boardKeys = {
  all: ["boards"] as const,
  detail: (id: string) => ["boards", id] as const,
};

export function useBoard(id: string) {
  return useQuery({
    queryKey: boardKeys.detail(id),
    queryFn: () => api.getBoard(id),
    enabled: !!id,
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createBoard,
    onSuccess: (board) => {
      const summary: BoardSummary = {
        id: board.id,
        name: board.name,
        description: board.description,
        workspace_id: board.workspace_id,
        created_at: board.created_at,
        updated_at: board.updated_at,
      };
      queryClient.setQueryData<Workspace[]>(workspaceKeys.all, (old) =>
        old?.map((ws) =>
          ws.id === board.workspace_id
            ? { ...ws, boards: [...ws.boards, summary] }
            : ws
        )
      );
      queryClient.setQueryData(boardKeys.detail(board.id), board);
      toast.success(`Tablero "${board.name}" creado`);
    },
    onError: () => {
      toast.error("Error al crear tablero");
    },
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; description?: string };
    }) => api.updateBoard(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<Workspace[]>(workspaceKeys.all, (old) =>
        old?.map((ws) => ({
          ...ws,
          boards: ws.boards.map((b) =>
            b.id === updated.id ? { ...b, ...updated } : b
          ),
        }))
      );
      toast.success("Tablero actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar tablero");
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteBoard,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<Workspace[]>(workspaceKeys.all, (old) =>
        old?.map((ws) => ({
          ...ws,
          boards: ws.boards.filter((b) => b.id !== deletedId),
        }))
      );
      queryClient.removeQueries({ queryKey: boardKeys.detail(deletedId) });
      toast.success("Tablero eliminado");
    },
    onError: () => {
      toast.error("Error al eliminar tablero");
    },
  });
}
