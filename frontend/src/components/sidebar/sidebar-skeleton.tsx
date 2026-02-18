import { Skeleton } from "@/components/ui/skeleton";

export function SidebarSkeleton() {
  return (
    <aside className="w-64 border-r bg-slate-50 flex flex-col h-screen shrink-0">
      <div className="px-4 py-4 border-b">
        <Skeleton className="h-6 w-28" />
      </div>
      <div className="p-3 space-y-4 flex-1">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20 mx-2" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        ))}
      </div>
      <div className="border-t p-3">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </aside>
  );
}
