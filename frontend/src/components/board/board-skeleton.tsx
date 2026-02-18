import { Skeleton } from "@/components/ui/skeleton";

export function BoardSkeleton() {
  return (
    <div className="flex gap-6 p-6 overflow-x-auto flex-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col w-72 shrink-0 gap-3">
          {/* Column header */}
          <div className="flex items-center gap-2 px-2 pb-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          {/* Task cards */}
          {Array.from({ length: i === 0 ? 3 : i === 1 ? 2 : 1 }).map(
            (_, j) => (
              <Skeleton key={j} className="h-28 w-full rounded-lg" />
            )
          )}
        </div>
      ))}
    </div>
  );
}
