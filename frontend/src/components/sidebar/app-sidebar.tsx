"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { WorkspaceMenu } from "./workspace-menu";
import { BoardMenu } from "./board-menu";
import { useWorkspaces } from "@/lib/hooks/use-workspaces";
import { SidebarSkeleton } from "./sidebar-skeleton";

export function AppSidebar() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const pathname = usePathname();

  if (isLoading || !workspaces) return <SidebarSkeleton />;

  return (
    <aside className="w-64 border-r bg-slate-50 flex flex-col h-screen shrink-0">
      <div className="px-4 py-4 border-b">
        <Link href="/" className="text-lg font-bold text-slate-900">
          Stward Task
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {workspaces.map((ws) => (
            <div key={ws.id}>
              <div className="flex items-center justify-between mb-1 px-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-snug flex-1 min-w-0 break-words">
                  {ws.name}
                </span>
                <div className="shrink-0 ml-1">
                  <WorkspaceMenu workspace={ws} />
                </div>
              </div>

              <div className="space-y-0.5">
                {ws.boards.map((board) => {
                  const isActive = pathname === `/board/${board.id}`;
                  return (
                    <div
                      key={board.id}
                      className={`group flex items-center rounded-md ${
                        isActive
                          ? "bg-slate-200 text-slate-900"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Link
                        href={`/board/${board.id}`}
                        className="flex-1 px-3 py-1.5 text-sm truncate min-w-0"
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
                  <p className="px-3 py-1 text-xs text-slate-400 italic">
                    Sin tableros
                  </p>
                )}
              </div>
            </div>
          ))}

          {workspaces.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">
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
