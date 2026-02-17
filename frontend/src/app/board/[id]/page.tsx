import { getBoard } from "@/lib/api";
import { KanbanBoard } from "@/components/board/kanban-board";

// Un tablero Kanban debe mostrar siempre datos actualizados
export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function BoardPage({ params }: Props) {
  const board = await getBoard(params.id);

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="border-b bg-white px-6 py-4 flex items-center gap-4 shrink-0">
        <h1 className="text-lg font-bold text-slate-900">{board.name}</h1>
        {board.description && (
          <p className="text-sm text-slate-500">{board.description}</p>
        )}
      </header>

      {/* Board */}
      <KanbanBoard initialBoard={board} />
    </div>
  );
}
