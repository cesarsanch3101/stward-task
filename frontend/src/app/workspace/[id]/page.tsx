"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAuthenticated } from "@/lib/auth";
import { useWorkspaceDetail } from "@/lib/hooks/use-workspace-detail";
import { useUIStore } from "@/lib/stores/ui-store";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { WorkspaceDashboard } from "@/components/workspace/workspace-dashboard";
import { WorkspaceGantt } from "@/components/workspace/workspace-gantt";
import { ErrorBoundary } from "@/components/error-boundary";
import { SidebarSkeleton } from "@/components/sidebar/sidebar-skeleton";
import { Button } from "@/components/ui/button";
import { PieChart, GanttChart, RefreshCw } from "lucide-react";

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  const { workspace, boards, allTasks, isLoading, isFetching } = useWorkspaceDetail(id);
  const { workspaceView, setWorkspaceView } = useUIStore();

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <SidebarSkeleton />
        <main className="flex-1 overflow-auto">
          <div className="h-full bg-background flex flex-col">
            <header className="border-b bg-card px-6 py-4 shrink-0">
              <div className="h-7 w-56 bg-muted rounded animate-pulse" />
            </header>
            <div className="flex-1 p-6 grid grid-cols-4 gap-4">
              {[1,2,3,4].map((i) => <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />)}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Workspace no encontrado.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main id="main-content" className="flex-1 overflow-auto">
        <div className="h-full bg-background flex flex-col">
          <header className="border-b bg-card px-6 py-4 flex items-center gap-4 shrink-0">
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{workspace.name}</h1>
              <p className="text-xs text-muted-foreground">
                {boards.length} tablero{boards.length !== 1 ? "s" : ""} · {allTasks.length} tarea{allTasks.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-1 rounded border border-border/50 bg-muted/20 p-0.5" role="group" aria-label="Cambiar vista">
                <Button
                  variant={workspaceView === "dashboard" ? "secondary" : "ghost"}
                  size="sm"
                  className={`h-7 gap-1.5 px-3 rounded-sm text-xs font-semibold transition-all ${
                    workspaceView === "dashboard"
                      ? "bg-white dark:bg-muted shadow-sm text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setWorkspaceView("dashboard")}
                  aria-pressed={workspaceView === "dashboard"}
                >
                  <PieChart className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </Button>
                <Button
                  variant={workspaceView === "gantt" ? "secondary" : "ghost"}
                  size="sm"
                  className={`h-7 gap-1.5 px-3 rounded-sm text-xs font-semibold transition-all ${
                    workspaceView === "gantt"
                      ? "bg-white dark:bg-muted shadow-sm text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setWorkspaceView("gantt")}
                  aria-pressed={workspaceView === "gantt"}
                >
                  <GanttChart className="h-3.5 w-3.5" />
                  <span>Gantt</span>
                </Button>
              </div>

              {isFetching && !isLoading && (
                <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
              )}
            </div>
          </header>

          <ErrorBoundary>
            {workspaceView === "dashboard" ? (
              <WorkspaceDashboard boards={boards} allTasks={allTasks} isLoading={isLoading} />
            ) : (
              <WorkspaceGantt boards={boards} isLoading={isLoading} />
            )}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
