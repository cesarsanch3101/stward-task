import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth";
import {
  Board,
  BoardSummary,
  Column,
  PaginatedResponse,
  Task,
  TokenPair,
  User,
  Workspace,
} from "./types";

// Server-side (SSR) uses the Docker internal network; client-side uses the public URL
const API_BASE_SERVER = process.env.API_URL_INTERNAL ?? "http://backend:8000/api/v1";
const API_BASE_CLIENT =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function getApiBase() {
  return typeof window === "undefined" ? API_BASE_SERVER : API_BASE_CLIENT;
}

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function handleTokenRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${getApiBase()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const tokens: TokenPair = await res.json();
    setTokens(tokens);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...init?.headers,
    },
  });

  // Auto-refresh on 401
  if (res.status === 401 && typeof window !== "undefined") {
    const refreshed = await handleTokenRefresh();
    if (refreshed) {
      const retryRes = await fetch(`${getApiBase()}${path}`, {
        cache: "no-store",
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
          ...init?.headers,
        },
      });
      if (retryRes.ok) return retryRes.json();
    }
    // Redirect to login if refresh also fails
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API ${res.status}: ${errorText}`);
  }
  return res.json();
}

async function fetchNoContent(path: string, init?: RequestInit) {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...init?.headers,
    },
  });

  if (res.status === 401 && typeof window !== "undefined") {
    const refreshed = await handleTokenRefresh();
    if (refreshed) {
      const retryRes = await fetch(`${getApiBase()}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
          ...init?.headers,
        },
      });
      if (retryRes.ok || retryRes.status === 204) return;
    }
    window.location.href = "/login";
  }

  if (!res.ok && res.status !== 204) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
}

// ─── Auth ─────────────────────────────────────────
export function login(data: { email: string; password: string }) {
  return fetcher<TokenPair>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function register(data: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}) {
  return fetcher<TokenPair>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMe() {
  return fetcher<User>("/auth/me");
}

// ─── Workspaces ──────────────────────────────────
export function getWorkspaces() {
  return fetcher<PaginatedResponse<Workspace>>("/workspaces");
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
  return fetcher<PaginatedResponse<BoardSummary>>("/boards");
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

// ─── Columns ────────────────────────────────────
export function updateColumn(
  columnId: string,
  data: { name?: string; color?: string; status?: string }
) {
  return fetcher<Column>(`/columns/${columnId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
