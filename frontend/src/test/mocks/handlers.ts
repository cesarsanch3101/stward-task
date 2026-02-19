import { http, HttpResponse } from "msw";

const API_BASE = "http://localhost:8000/api/v1";

export const handlers = [
  // Auth
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.password === "testpass123") {
      return HttpResponse.json({ access: "mock-access", refresh: "mock-refresh" });
    }
    return HttpResponse.json(
      { detail: "Credenciales inválidas." },
      { status: 401 }
    );
  }),

  http.post(`${API_BASE}/auth/register`, () => {
    return HttpResponse.json(
      { access: "mock-access", refresh: "mock-refresh" },
      { status: 201 }
    );
  }),

  http.get(`${API_BASE}/auth/me`, () => {
    return HttpResponse.json({
      id: "test-user-id",
      email: "test@test.com",
      first_name: "Test",
      last_name: "User",
    });
  }),

  // Workspaces
  http.get(`${API_BASE}/workspaces`, () => {
    return HttpResponse.json({
      items: [
        {
          id: "ws-1",
          name: "Workspace 1",
          description: "",
          owner_id: "test-user-id",
          boards: [
            {
              id: "board-1",
              name: "Board 1",
              description: "",
              workspace_id: "ws-1",
              created_at: "2026-01-01T00:00:00Z",
              updated_at: "2026-01-01T00:00:00Z",
            },
          ],
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ],
      count: 1,
    });
  }),

  // Boards
  http.get(`${API_BASE}/boards`, () => {
    return HttpResponse.json({
      items: [],
      count: 0,
    });
  }),

  http.get(`${API_BASE}/boards/:id`, () => {
    return HttpResponse.json({
      id: "board-1",
      name: "Board 1",
      description: "",
      workspace_id: "ws-1",
      columns: [
        {
          id: "col-1",
          name: "Pendiente",
          order: 0,
          status: "pending",
          tasks: [],
        },
        {
          id: "col-2",
          name: "En Progreso",
          order: 1,
          status: "in_progress",
          tasks: [],
        },
      ],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
  }),
];
