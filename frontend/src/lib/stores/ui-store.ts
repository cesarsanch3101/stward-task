import { create } from "zustand";

type BoardView = "kanban" | "table" | "dashboard" | "gantt";

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  boardView: BoardView;
  setBoardView: (v: BoardView) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  boardView: "kanban",
  setBoardView: (v) => set({ boardView: v }),
}));
