"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/lib/api";
import { boardKeys } from "./use-board";
import type { Board, Column } from "@/lib/types";

function updateBoardColumns(
  board: Board | undefined,
  updater: (columns: Column[]) => Column[]
): Board | undefined {
  if (!board) return board;
  return { ...board, columns: updater(board.columns) };
}

export function useCreateTask(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createTask,
    onSuccess: (task) => {
      queryClient.setQueryData<Board>(boardKeys.detail(boardId), (old) =>
        updateBoardColumns(old, (cols) =>
          cols.map((col) =>
            col.id === task.column_id
              ? { ...col, tasks: [...col.tasks, task] }
              : col
          )
        )
      );
      toast.success("Tarea creada");
    },
    onError: () => {
      toast.error("Error al crear tarea");
    },
  });
}

export function useUpdateTask(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof api.updateTask>[1];
    }) => api.updateTask(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<Board>(boardKeys.detail(boardId), (old) =>
        updateBoardColumns(old, (cols) =>
          cols.map((col) => ({
            ...col,
            tasks: col.tasks.map((t) =>
              t.id === updated.id ? { ...t, ...updated } : t
            ),
          }))
        )
      );
      toast.success("Tarea actualizada");
    },
    onError: () => {
      toast.error("Error al actualizar tarea");
    },
  });
}

export function useDeleteTask(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteTask,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<Board>(boardKeys.detail(boardId), (old) =>
        updateBoardColumns(old, (cols) =>
          cols.map((col) => ({
            ...col,
            tasks: col.tasks.filter((t) => t.id !== deletedId),
          }))
        )
      );
      toast.success("Tarea eliminada");
    },
    onError: () => {
      toast.error("Error al eliminar tarea");
    },
  });
}

export function useUpdateColumn(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof api.updateColumn>[1];
    }) => api.updateColumn(id, data),
    onSuccess: (updatedColumn) => {
      queryClient.setQueryData<Board>(boardKeys.detail(boardId), (old) => {
        if (!old) return old;
        return {
          ...old,
          columns: old.columns.map((col) =>
            col.id === updatedColumn.id
              ? { ...col, ...updatedColumn }
              : col
          ),
        };
      });
      toast.success("Columna actualizada");
    },
    onError: () => {
      toast.error("Error al actualizar columna");
    },
  });
}

export function useMoveTask(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      columnId,
      newOrder,
    }: {
      taskId: string;
      columnId: string;
      newOrder: number;
    }) => api.moveTask(taskId, columnId, newOrder),
    onSuccess: (updated) => {
      queryClient.setQueryData<Board>(boardKeys.detail(boardId), (old) =>
        updateBoardColumns(old, (cols) => {
          // Remove the task from all columns
          const withoutTask = cols.map((col) => ({
            ...col,
            tasks: col.tasks.filter((t) => t.id !== updated.id),
          }));
          // Insert into the target column at the correct position
          return withoutTask.map((col) => {
            if (col.id !== updated.column_id) return col;
            const tasks = [...col.tasks];
            const insertAt = Math.min(updated.order ?? tasks.length, tasks.length);
            tasks.splice(insertAt, 0, { ...updated });
            return { ...col, tasks };
          });
        })
      );
    },
    onError: (error: unknown) => {
      let message = "Error al mover tarea";
      if (error instanceof Error) {
        const match = error.message.match(/^API \d+: ([\s\S]+)$/);
        if (match) {
          try {
            const body = JSON.parse(match[1]);
            if (typeof body.detail === "string") message = body.detail;
          } catch {
            /* usar mensaje por defecto */
          }
        }
      }
      toast.error(message);
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });
}
