"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Shield, LogOut } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { WorkspaceMenu } from "./workspace-menu";
import { BoardMenu } from "./board-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "./notification-bell";
import { useWorkspaces } from "@/lib/hooks/use-workspaces";
import { useCurrentUser, useLogout } from "@/lib/hooks/use-auth";
import { SidebarSkeleton } from "./sidebar-skeleton";
import { isAuthenticated } from "@/lib/auth";

export function AppSidebar() {
  const { data, isLoading } = useWorkspaces();
  const { data: currentUser } = useCurrentUser();
  const logout = useLogout();
  const pathname = usePathname();
  const router = useRouter();

  // If tokens are gone (cleared by expired session), go to login
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  // Show skeleton until data is available (prevents hydration flash)
  if (isLoading || !data) return <SidebarSkeleton />;

  // On error or disabled query, fall back to empty list — never stuck in skeleton
  const workspaces = data?.items ?? [];

  return (
    <aside className="w-64 bg-monday-sidebar flex flex-col h-screen shrink-0 text-white" role="navigation" aria-label="Espacios de trabajo">
      <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
        <Link href="/" prefetch={false} className="text-xl font-bold tracking-tight">
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
              <div className="flex items-center gap-1 mb-2">
                <Link
                  href={`/workspace/${ws.id}`}
                  className={`flex items-center flex-1 min-w-0 bg-white/10 border border-white/20 rounded-md px-3 py-1.5 hover:bg-white/15 transition-colors ${
                    pathname === `/workspace/${ws.id}` ? "bg-white/20 border-white/30" : ""
                  }`}
                >
                  <span className="text-sm font-bold text-white tracking-wide flex-1 min-w-0 break-words leading-tight">
                    {ws.name}
                  </span>
                </Link>
                <div className="shrink-0">
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

      <div className="border-t p-3 space-y-2">
        {currentUser?.role === "administrador" && (
          <Link
            href="/admin/users"
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${
              pathname === "/admin/users"
                ? "bg-white/20 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            Control de Acceso
          </Link>
        )}
        <CreateWorkspaceDialog />
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded w-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
