"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { useWorkspaces } from "@/lib/hooks/use-workspaces";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarSkeleton } from "@/components/sidebar/sidebar-skeleton";

export default function Home() {
  const router = useRouter();
  const { data, isLoading, isError } = useWorkspaces();
  const workspaces = data?.items;

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  // Auto-redirect to first board
  useEffect(() => {
    if (!workspaces) return;
    for (const w of workspaces) {
      if (w.boards.length > 0) {
        router.push(`/board/${w.boards[0].id}`);
        return;
      }
    }
  }, [workspaces, router]);

  if (isError) {
    router.push("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <SidebarSkeleton />
        <main className="flex-1 overflow-auto">
          <div className="flex items-center justify-center h-full bg-slate-50">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
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
