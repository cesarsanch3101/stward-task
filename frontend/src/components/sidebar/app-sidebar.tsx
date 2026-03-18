"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Shield, LogOut, LayoutGrid, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
  const { data } = useWorkspaces();
  const { data: currentUser } = useCurrentUser();
  const logout = useLogout();
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  const workspaces = data?.items ?? [];

  return (
    <aside
      className={[
        "bg-monday-sidebar flex flex-col h-screen shrink-0 text-white",
        "transition-[width] duration-300 ease-in-out overflow-hidden",
        sidebarOpen ? "w-80" : "w-12",
      ].join(" ")}
      role="navigation"
      aria-label="Espacios de trabajo"
    >
      {/* ── Header ── */}
      <div className="border-b border-white/10 flex items-center shrink-0 h-[62px]">
        {sidebarOpen ? (
          <div className="flex items-center justify-between w-full px-4 gap-2">
            <Link
              href="/"
              prefetch={false}
              className="text-xl font-bold tracking-tight truncate flex-1 min-w-0"
            >
              Stward Task
            </Link>
            <div className="flex items-center gap-1 shrink-0">
              <NotificationBell />
              <ThemeToggle />
              <button
                type="button"
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors rounded"
                aria-label="Colapsar sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <button
              type="button"
              onClick={toggleSidebar}
              className="text-white/60 hover:text-white transition-colors p-1 rounded"
              aria-label="Expandir sidebar"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Body (solo cuando expandido) ── */}
      {sidebarOpen && (
        <>
          {/* div nativo en lugar de ScrollArea: Radix ScrollArea agrega display:table
              internamente, lo que rompe el ancho de todos los flex containers hijos */}
          <div className="flex-1 overflow-y-auto min-h-0">
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
                        {/* Workspace header — flex row: Link crece, botón ⋯ es shrink-0 */}
                        <div className="flex items-center gap-1 mb-2">
                          <Link
                            href={`/workspace/${ws.id}`}
                            className={[
                              "flex items-center gap-2 flex-1 min-w-0 rounded-lg px-3 py-2 border transition-all duration-150",
                              isWsActive
                                ? "bg-indigo-500/20 border-indigo-400/20 text-white"
                                : "border-transparent hover:bg-indigo-500/10 hover:text-white",
                            ].join(" ")}
                          >
                            <LayoutGrid className="h-3.5 w-3.5 text-white/60 shrink-0" />
                            <span
                              className="text-sm font-bold text-white tracking-wide truncate"
                              title={ws.name}
                            >
                              {ws.name}
                            </span>
                          </Link>
                          {/* Botón ⋯ workspace — sibling flex shrink-0, siempre visible */}
                          <div className="shrink-0">
                            <WorkspaceMenu workspace={ws} />
                          </div>
                        </div>

                        {/* Board items */}
                        <div className="space-y-1">
                          {ws.boards.map((board) => {
                            const isActive = pathname === `/board/${board.id}`;
                            return (
                              <div
                                key={board.id}
                                className={[
                                  "group flex items-center rounded transition-colors",
                                  isActive
                                    ? "bg-indigo-500/15 text-white"
                                    : "text-white/70 hover:bg-indigo-500/10 hover:text-white",
                                ].join(" ")}
                              >
                                <Link
                                  href={`/board/${board.id}`}
                                  className="flex-1 min-w-0 px-3 py-2 text-sm font-medium truncate"
                                  aria-current={isActive ? "page" : undefined}
                                  title={board.name}
                                >
                                  {board.name}
                                </Link>
                                {/* Botón ⋯ board — sibling flex shrink-0 */}
                                <div
                                  className={[
                                    "shrink-0 pr-1 transition-opacity duration-150",
                                    isActive
                                      ? "opacity-100"
                                      : "opacity-0 group-hover:opacity-100",
                                  ].join(" ")}
                                >
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
          </div>

          {/* ── Footer ── */}
          <div className="border-t p-3 space-y-2">
            {currentUser?.role === "administrador" && (
              <Link
                href="/admin/users"
                className={[
                  "flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors",
                  pathname === "/admin/users"
                    ? "bg-indigo-500/15 text-white"
                    : "text-white/70 hover:bg-indigo-500/10 hover:text-white",
                ].join(" ")}
              >
                <Shield className="h-3.5 w-3.5 shrink-0" />
                Control de Acceso
              </Link>
            )}
            <CreateWorkspaceDialog />
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded w-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
