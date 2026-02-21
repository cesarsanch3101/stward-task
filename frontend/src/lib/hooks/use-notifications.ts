"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

export const notificationKeys = {
  all: ["notifications"] as const,
  count: ["notifications", "count"] as const,
};

export function useNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.count,
    queryFn: api.getNotificationCount,
    enabled: isAuthenticated(),
    refetchInterval: 30_000,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: api.getNotifications,
    enabled: isAuthenticated(),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.count });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.count });
    },
  });
}
