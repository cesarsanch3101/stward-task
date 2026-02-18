"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWorkspaces } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Workspace } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    getWorkspaces()
      .then((ws) => {
        setWorkspaces(ws);
        // Auto-redirect to first board
        for (const w of ws) {
          if (w.boards.length > 0) {
            router.push(`/board/${w.boards[0].id}`);
            return;
          }
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar initialWorkspaces={workspaces} />
      <main className="flex-1 overflow-auto">
        <div className="flex items-center justify-center h-full bg-slate-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Bienvenido a Stward Task
            </h1>
            <p className="text-slate-500">
              Crea un espacio de trabajo y un tablero desde el panel lateral para
              comenzar.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
