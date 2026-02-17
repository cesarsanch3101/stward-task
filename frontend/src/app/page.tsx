import { redirect } from "next/navigation";
import { getWorkspaces } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const workspaces = await getWorkspaces();

  // Auto-redirect to the first board if one exists
  for (const ws of workspaces) {
    if (ws.boards.length > 0) {
      redirect(`/board/${ws.boards[0].id}`);
    }
  }

  return (
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
  );
}
