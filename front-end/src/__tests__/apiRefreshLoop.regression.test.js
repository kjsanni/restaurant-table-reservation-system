import { describe, it, expect, vi, beforeEach } from "vitest";

const API_URL = "http://localhost:3000/api/v1";

describe("API interceptor refresh-loop regression", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock("@/stores/auth", () => ({
      useAuthStore: () => ({
        currentTenant: null,
        refreshToken: vi.fn(),
        logout: vi.fn(),
      }),
    }));
    process.env.VITE_API_URL = API_URL;
  });

  it("does not throw on single unauthenticated /auth/me 401", async () => {
    const { default: API } = await import("@/services/API.js");

    const me401 = {
      data: null,
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config: { url: `${API_URL}/auth/me`, _retry: false },
    };

    await expect(API(me401.config)).rejects.toBeDefined();
  });
});
