"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { notificationKeys } from "./use-notifications";

export const commentKeys = {
  forTask: (taskId: string) => ["comments", taskId] as const,
};

export function useComments(taskId: string) {
  return useQuery({
    queryKey: commentKeys.forTask(taskId),
    queryFn: () => api.getComments(taskId),
    enabled: !!taskId,
  });
}

export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => api.createComment(taskId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.forTask(taskId) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.count });
    },
  });
}
