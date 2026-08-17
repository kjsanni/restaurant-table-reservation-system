import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ProvisioningView from "@/views/admin/ProvisioningView.vue";
import { useRoute } from "vue-router";

vi.mock("vue-router", () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock("@/services/adminAPI", () => ({
  default: {
    getTenantProvisioningStatus: vi.fn(),
    listProvisioningSteps: vi.fn(),
    getTenant: vi.fn(),
    startTenantProvisioning: vi.fn(),
    pauseTenantProvisioning: vi.fn(),
    resumeTenantProvisioning: vi.fn(),
    rollbackTenantProvisioning: vi.fn(),
  },
}));

describe("ProvisioningView", () => {
  it("renders provisioning view", () => {
    useRoute.mockReturnValue({ params: { id: "1" } });
    const wrapper = mount(ProvisioningView);
    expect(wrapper.text()).toContain("Provisioning");
  });
});
