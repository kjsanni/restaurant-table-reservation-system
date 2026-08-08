import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAuthStore } from "@/stores/auth";

vi.mock("@/services/authAPI", () => ({
  default: {
    logout: vi.fn().mockResolvedValue({}),
  },
}));

describe("auth store logout", () => {
  beforeEach(() => {
    vi.resetModules();
    setActivePinia(createPinia());
  });

  it("clears currentTenant on logout", async () => {
    const authStore = useAuthStore();
    authStore.user = { id: 1, email: "test@example.com", role: "admin" };
    authStore.currentTenant = { id: 1, name: "Test Tenant" };
    authStore.entryPoint = "tenant";

    await authStore.logout();

    expect(authStore.user).toBeNull();
    expect(authStore.currentTenant).toBeNull();
    expect(authStore.entryPoint).toBeNull();
  });
});
