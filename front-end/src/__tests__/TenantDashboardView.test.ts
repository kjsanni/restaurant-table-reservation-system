import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import TenantDashboardView from "@/views/TenantDashboardView.vue";
import { useAuthStore } from "@/stores/auth";

vi.mock("@/services/reservationAPI", () => ({
  default: { getReservations: vi.fn() },
}));
vi.mock("@/services/tableAPI", () => ({
  default: { getTables: vi.fn() },
}));
vi.mock("@/services/appointmentAPI", () => ({
  default: { getAppointments: vi.fn() },
}));
vi.mock("@/services/salonDashboardAPI", () => ({
  default: { getDashboard: vi.fn() },
}));
vi.mock("@/services/orderAPI", () => ({
  default: { getOrders: vi.fn() },
}));

describe("TenantDashboardView", () => {
  it("renders restaurant KPIs when tenant is restaurant", () => {
    const authStore = useAuthStore();
    authStore.currentTenant = {
      id: 1,
      businessVertical: "restaurant",
      name: "Test Restaurant",
    };
    authStore.capabilities = { serviceModes: ["dine_in"] };

    const wrapper = mount(TenantDashboardView, {
      global: { provide: { authStore } },
    });

    expect(wrapper.text()).toContain("Restaurant");
  });

  it("renders salon KPIs when tenant is salon", () => {
    const authStore = useAuthStore();
    authStore.currentTenant = {
      id: 2,
      businessVertical: "salon",
      name: "Test Salon",
    };
    authStore.capabilities = { serviceModes: ["dine_in"] };

    const wrapper = mount(TenantDashboardView, {
      global: { provide: { authStore } },
    });

    expect(wrapper.text()).toContain("Salon");
  });
});
