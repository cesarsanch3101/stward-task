import { describe, expect, it, vi, beforeEach } from "vitest";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";

// Mock auth module
vi.mock("./auth", () => ({
  getAccessToken: vi.fn(() => "mock-token"),
  getRefreshToken: vi.fn(() => "mock-refresh"),
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
}));

// Import after mocking
import * as api from "./api";

describe("API client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("returns tokens on successful login", async () => {
      const result = await api.login({
        email: "test@test.com",
        password: "testpass123",
      });
      expect(result).toEqual({
        access: "mock-access",
        refresh: "mock-refresh",
      });
    });

    it("throws on invalid credentials", async () => {
      await expect(
        api.login({ email: "test@test.com", password: "wrong" })
      ).rejects.toThrow();
    });
  });

  describe("getMe", () => {
    it("returns user data", async () => {
      const user = await api.getMe();
      expect(user.email).toBe("test@test.com");
      expect(user.id).toBe("test-user-id");
    });
  });

  describe("getWorkspaces", () => {
    it("returns paginated workspaces", async () => {
      const result = await api.getWorkspaces();
      expect(result.items).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.items[0].name).toBe("Workspace 1");
    });
  });

  describe("error handling", () => {
    it("throws on server error", async () => {
      server.use(
        http.get("http://localhost:8000/api/v1/workspaces", () => {
          return HttpResponse.json(
            { detail: "Server error" },
            { status: 500 }
          );
        })
      );

      await expect(api.getWorkspaces()).rejects.toThrow("API 500");
    });
  });
});
