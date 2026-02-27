"use client";

import { useQueries } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { boardKeys } from "./use-board";
import { useWorkspaces } from "./use-workspaces";
import type { Board } from "@/lib/types";

export function useWorkspaceDetail(workspaceId: string) {
  const workspacesQuery = useWorkspaces();
  const workspace = workspacesQuery.data?.items.find((w) => w.id === workspaceId);

  const boardQueries = useQueries({
    queries: (workspace?.boards ?? []).map((b) => ({
      queryKey: boardKeys.detail(b.id),
      queryFn: () => api.getBoard(b.id),
      staleTime: 60_000,
    })),
  });

  const boards = boardQueries
    .map((q) => q.data)
    .filter((b): b is Board => !!b);

  const allTasks = boards.flatMap((b) =>
    b.columns.flatMap((c) => c.tasks ?? [])
  );

  const isLoading =
    workspacesQuery.isLoading || boardQueries.some((q) => q.isLoading);
  const isFetching = boardQueries.some((q) => q.isFetching);

  return { workspace, boards, allTasks, isLoading, isFetching };
}
