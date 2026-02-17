import { Board, BoardSummary, Task, Workspace } from "./types";

// Server-side (SSR) uses the Docker internal network; client-side uses the public URL
const API_BASE_SERVER = process.env.API_URL_INTERNAL ?? "http://backend:8000/api";
const API_BASE_CLIENT = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function getApiBase() {
  return typeof window === "undefined" ? API_BASE_SERVER : API_BASE_CLIENT;
}

async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    cache: "no-store",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function fetchNoContent(path: string, init?: RequestInit) {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
}

// ─── Workspaces ──────────────────────────────────
export function getWorkspaces() {
  return fetcher<Workspace[]>("/workspaces");
}

export function createWorkspace(data: { name: string; description?: string }) {
  return fetcher<Workspace>("/workspaces", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateWorkspace(
  workspaceId: string,
  data: { name?: string; description?: string }
) {
  return fetcher<Workspace>(`/workspaces/${workspaceId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteWorkspace(workspaceId: string) {
  return fetchNoContent(`/workspaces/${workspaceId}`, { method: "DELETE" });
}

// ─── Boards ──────────────────────────────────────
export function getBoards() {
  return fetcher<BoardSummary[]>("/boards");
}

export function getBoard(id: string) {
  return fetcher<Board>(`/boards/${id}`);
}

export function createBoard(data: {
  name: string;
  description?: string;
  workspace_id: string;
}) {
  return fetcher<Board>("/boards", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBoard(
  boardId: string,
  data: { name?: string; description?: string }
) {
  return fetcher<BoardSummary>(`/boards/${boardId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteBoard(boardId: string) {
  return fetchNoContent(`/boards/${boardId}`, { method: "DELETE" });
}

// ─── Tasks ───────────────────────────────────────
export function moveTask(taskId: string, columnId: string, newOrder: number) {
  return fetcher<Task>(`/tasks/${taskId}/move`, {
    method: "POST",
    body: JSON.stringify({ column_id: columnId, new_order: newOrder }),
  });
}

export function createTask(data: {
  title: string;
  column_id: string;
  description?: string;
  priority?: string;
  assignee_name?: string;
  start_date?: string | null;
  end_date?: string | null;
  progress?: number;
}) {
  return fetcher<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    priority?: string;
    assignee_name?: string;
    start_date?: string | null;
    end_date?: string | null;
    progress?: number;
  }
) {
  return fetcher<Task>(`/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteTask(taskId: string) {
  return fetchNoContent(`/tasks/${taskId}`, { method: "DELETE" });
}
