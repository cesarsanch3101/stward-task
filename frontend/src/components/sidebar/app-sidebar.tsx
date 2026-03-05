"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Shield, LogOut, LayoutGrid, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { WorkspaceMenu } from "./workspace-menu";
import { BoardMenu } from "./board-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "./notification-bell";
import { useWorkspaces } from "@/lib/hooks/use-workspaces";
import { useCurrentUser, useLogout } from "@/lib/hooks/use-auth";
import { isAuthenticated } from "@/lib/auth";
import { useUIStore } from "@/lib/stores/ui-store";

export function AppSidebar() {
  const { data, isLoading } = useWorkspaces();
  const { data: currentUser } = useCurrentUser();
  const logout = useLogout();
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  const workspaces = data?.items ?? [];

  /* ── Collapsed strip ── */
  if (!sidebarOpen) {
    return (
      <aside
        className="w-12 bg-monday-sidebar flex flex-col h-screen shrink-0 items-center pt-5 gap-4 transition-all duration-200"
        role="navigation"
        aria-label="Espacios de trabajo (colapsado)"
      >
        <button
          type="button"
          onClick={toggleSidebar}
          className="text-white/60 hover:text-white transition-colors"
          aria-label="Expandir sidebar"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      </aside>
    );
  }

  /* ── Full sidebar ── */
  return (
    <aside
      className="w-72 bg-monday-sidebar flex flex-col h-screen shrink-0 text-white transition-all duration-200"
      role="navigation"
      aria-label="Espacios de trabajo"
    >
      {/* Header */}
      <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between gap-2">
        <Link href="/" prefetch={false} className="text-xl font-bold tracking-tight truncate">
          Stward Task
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <NotificationBell />
          <ThemeToggle />
          <button
            type="button"
            onClick={toggleSidebar}
            className="text-white/60 hover:text-white transition-colors p-1 rounded"
            aria-label="Colapsar sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {!data ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-8 w-full bg-white/10 rounded-md animate-pulse" />
                  <div className="h-6 w-full bg-white/5 rounded-md animate-pulse" />
                  <div className="h-6 w-4/5 bg-white/5 rounded-md animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {workspaces.map((ws) => {
                const isWsActive = pathname === `/workspace/${ws.id}`;
                return (
                  <div key={ws.id}>
                    <div className="flex items-center gap-1 mb-2 min-w-0">
                      <Link
                        href={`/workspace/${ws.id}`}
                        className={[
                          "flex items-center gap-2 flex-1 min-w-0 rounded-lg px-3 py-2 border transition-all duration-150",
                          "bg-gradient-to-b shadow-[0_2px_5px_rgba(0,0,0,0.35)]",
                          isWsActive
                            ? "from-white/30 to-white/15 border-t-white/50 border-white/25 shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
                            : "from-white/20 to-white/[0.07] border-t-white/35 border-white/15 hover:from-white/25 hover:to-white/10 hover:border-t-white/45 hover:border-white/20 hover:shadow-[0_4px_10px_rgba(0,0,0,0.4)]",
                        ].join(" ")}
                      >
                        <LayoutGrid className="h-3.5 w-3.5 text-white/60 shrink-0" />
                        <span
                          className="text-sm font-bold text-white tracking-wide flex-1 min-w-0 truncate"
                          title={ws.name}
                        >
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
                            className={`group flex items-center rounded transition-colors ${
                              isActive
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
                );
              })}

              {workspaces.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Crea un espacio de trabajo para comenzar
                </p>
              )}
            </>
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
