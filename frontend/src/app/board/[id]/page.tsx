"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAuthenticated } from "@/lib/auth";
import { useBoard } from "@/lib/hooks/use-board";
import { useWorkspaces } from "@/lib/hooks/use-workspaces";
import { KanbanBoard } from "@/components/board/kanban-board";
import { TableView } from "@/components/board/table-view";
import { DashboardView } from "@/components/board/dashboard-view";
import { GanttView } from "@/components/board/gantt-view";
import { ViewToggle } from "@/components/board/view-toggle";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { BoardSkeleton } from "@/components/board/board-skeleton";
import { SidebarSkeleton } from "@/components/sidebar/sidebar-skeleton";
import { ErrorBoundary } from "@/components/error-boundary";
import { useUIStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function BoardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  const board = useBoard(params.id);
  const workspaces = useWorkspaces();
  const { boardView } = useUIStore();

  // Loading state
  if (board.isLoading || workspaces.isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <SidebarSkeleton />
        <main className="flex-1 overflow-auto">
          <div className="h-full bg-background flex flex-col">
            <header className="border-b bg-card px-6 py-4 shrink-0">
              <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            </header>
            <BoardSkeleton />
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (board.isError) {
    const is401 =
      board.error instanceof Error && board.error.message.includes("401");
    if (is401) {
      router.push("/login");
      return null;
    }

    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500">Error al cargar el tablero.</p>
          <Button
            variant="outline"
            onClick={() => board.refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!board.data) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main id="main-content" className="flex-1 overflow-auto">
        <div className="h-full bg-background flex flex-col">
          <header className="border-b bg-card px-6 py-4 flex items-center gap-4 shrink-0">
            <h1 className="text-lg font-bold text-foreground">
              {board.data.name}
            </h1>
            {board.data.description && (
              <p className="text-sm text-muted-foreground">
                {board.data.description}
              </p>
            )}
            <div className="ml-auto flex items-center gap-3">
              <ViewToggle />
              {board.isFetching && !board.isLoading && (
                <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
              )}
            </div>
          </header>
          <ErrorBoundary>
            {boardView === "kanban" ? (
              <KanbanBoard board={board.data} />
            ) : boardView === "table" ? (
              <TableView board={board.data} />
            ) : boardView === "gantt" ? (
              <GanttView board={board.data} />
            ) : (
              <DashboardView board={board.data} />
            )}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
