"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBoard, getWorkspaces } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { KanbanBoard } from "@/components/board/kanban-board";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Board, Workspace } from "@/lib/types";

export default function BoardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [board, setBoard] = useState<Board | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    Promise.all([getBoard(params.id), getWorkspaces()])
      .then(([boardData, wsData]) => {
        setBoard(boardData);
        setWorkspaces(wsData);
        setLoading(false);
      })
      .catch((err) => {
        if (err instanceof Error && err.message.includes("401")) {
          router.push("/login");
        } else {
          setError("Error al cargar el tablero.");
          setLoading(false);
        }
      });
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando tablero...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">{error || "Tablero no encontrado."}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar initialWorkspaces={workspaces} />
      <main className="flex-1 overflow-auto">
        <div className="h-full bg-slate-50 flex flex-col">
          <header className="border-b bg-white px-6 py-4 flex items-center gap-4 shrink-0">
            <h1 className="text-lg font-bold text-slate-900">{board.name}</h1>
            {board.description && (
              <p className="text-sm text-slate-500">{board.description}</p>
            )}
          </header>
          <KanbanBoard initialBoard={board} />
        </div>
      </main>
    </div>
  );
}
