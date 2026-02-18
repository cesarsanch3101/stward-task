"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/lib/api";
import type { PaginatedResponse, Workspace } from "@/lib/types";

export const workspaceKeys = {
  all: ["workspaces"] as const,
  detail: (id: string) => ["workspaces", id] as const,
};

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.all,
    queryFn: api.getWorkspaces,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createWorkspace,
    onSuccess: (newWs) => {
      const wsWithBoards: Workspace = { ...newWs, boards: newWs.boards ?? [] };
      queryClient.setQueryData<PaginatedResponse<Workspace>>(
        workspaceKeys.all,
        (old) => ({
          items: old ? [...old.items, wsWithBoards] : [wsWithBoards],
          count: (old?.count ?? 0) + 1,
        })
      );
      toast.success(`Espacio "${newWs.name}" creado`);
    },
    onError: () => {
      toast.error("Error al crear espacio de trabajo");
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; description?: string };
    }) => api.updateWorkspace(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<PaginatedResponse<Workspace>>(
        workspaceKeys.all,
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((ws) =>
                  ws.id === updated.id
                    ? { ...ws, ...updated, boards: ws.boards }
                    : ws
                ),
              }
            : undefined
      );
      toast.success("Espacio actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar espacio de trabajo");
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteWorkspace,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<PaginatedResponse<Workspace>>(
        workspaceKeys.all,
        (old) =>
          old
            ? {
                ...old,
                items: old.items.filter((ws) => ws.id !== deletedId),
                count: old.count - 1,
              }
            : undefined
      );
      toast.success("Espacio eliminado");
    },
    onError: () => {
      toast.error("Error al eliminar espacio de trabajo");
    },
  });
}
