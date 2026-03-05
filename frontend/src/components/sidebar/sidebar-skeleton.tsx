export function SidebarSkeleton() {
  return (
    <aside className="w-72 bg-monday-sidebar flex flex-col h-screen shrink-0">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="h-6 w-28 bg-white/20 rounded animate-pulse" />
      </div>
      <div className="p-4 space-y-6 flex-1">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-8 w-full bg-white/10 rounded-md animate-pulse" />
            <div className="h-7 w-4/5 bg-white/10 rounded ml-3 animate-pulse" />
            <div className="h-7 w-4/5 bg-white/10 rounded ml-3 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 p-3">
        <div className="h-9 w-full bg-white/10 rounded-md animate-pulse" />
      </div>
    </aside>
  );
}
