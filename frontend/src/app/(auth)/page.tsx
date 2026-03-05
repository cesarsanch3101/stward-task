"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { useWorkspaces } from "@/lib/hooks/use-workspaces";

export default function Home() {
  const router = useRouter();
  const { data } = useWorkspaces();
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

  return (
    <div className="flex items-center justify-center h-full bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Bienvenido a Stward Task
        </h1>
        <p className="text-muted-foreground">
          Crea un espacio de trabajo y un tablero desde el panel lateral para
          comenzar.
        </p>
      </div>
    </div>
  );
}
