import { create } from "zustand";

type BoardView = "kanban" | "table" | "dashboard" | "gantt";
type WorkspaceView = "dashboard" | "gantt";

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  boardView: BoardView;
  setBoardView: (v: BoardView) => void;
  workspaceView: WorkspaceView;
  setWorkspaceView: (v: WorkspaceView) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  boardView: "kanban",
  setBoardView: (v) => set({ boardView: v }),
  workspaceView: "dashboard",
  setWorkspaceView: (v) => set({ workspaceView: v }),
}));
