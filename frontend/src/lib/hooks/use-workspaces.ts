"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/lib/api";
import type { Workspace } from "@/lib/types";

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
      queryClient.setQueryData<Workspace[]>(workspaceKeys.all, (old) =>
        old ? [...old, wsWithBoards] : [wsWithBoards]
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
      queryClient.setQueryData<Workspace[]>(workspaceKeys.all, (old) =>
        old?.map((ws) =>
          ws.id === updated.id ? { ...ws, ...updated, boards: ws.boards } : ws
        )
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
      queryClient.setQueryData<Workspace[]>(workspaceKeys.all, (old) =>
        old?.filter((ws) => ws.id !== deletedId)
      );
      toast.success("Espacio eliminado");
    },
    onError: () => {
      toast.error("Error al eliminar espacio de trabajo");
    },
  });
}
