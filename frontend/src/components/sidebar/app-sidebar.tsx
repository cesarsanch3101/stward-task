"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { WorkspaceMenu } from "./workspace-menu";
import { BoardMenu } from "./board-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "./notification-bell";
import { useWorkspaces } from "@/lib/hooks/use-workspaces";
import { SidebarSkeleton } from "./sidebar-skeleton";

export function AppSidebar() {
  const { data, isLoading } = useWorkspaces();
  const pathname = usePathname();
  const workspaces = data?.items;

  if (isLoading || !workspaces) return <SidebarSkeleton />;

  return (
    <aside className="w-64 bg-monday-sidebar flex flex-col h-screen shrink-0 text-white" role="navigation" aria-label="Espacios de trabajo">
      <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Stward Task
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {workspaces.map((ws) => (
            <div key={ws.id}>
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-[0.1em] flex-1 min-w-0">
                  {ws.name}
                </span>
                <div className="shrink-0 ml-1">
                  <WorkspaceMenu workspace={ws} />
                </div>
              </div>

              <div className="space-y-1">
                {ws.boards.map((board) => {
                  const isActive = pathname === `/board/${board.id}`;
                  return (
                    <div
                      key={board.id}
                      className={`group flex items-center rounded transition-colors ${isActive
                          ? "bg-white/20 text-white"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                      <Link
                        href={`/board/${board.id}`}
                        className="flex-1 px-3 py-2 text-sm font-medium truncate min-w-0"
                        aria-current={isActive ? "page" : undefined}
                      >
                        {board.name}
                      </Link>
                      <div className="shrink-0 pr-1 opacity-0 group-hover:opacity-100">
                        <BoardMenu board={board} />
                      </div>
                    </div>
                  );
                })}
                {ws.boards.length === 0 && (
                  <p className="px-3 py-1 text-xs text-muted-foreground italic">
                    Sin tableros
                  </p>
                )}
              </div>
            </div>
          ))}

          {workspaces.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Crea un espacio de trabajo para comenzar
            </p>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        <CreateWorkspaceDialog />
      </div>
    </aside>
  );
}
