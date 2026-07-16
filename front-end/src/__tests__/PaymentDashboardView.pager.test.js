import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import PaymentDashboardView from "@/views/PaymentDashboardView.vue";

describe("PaymentDashboardView", () => {
  it("should compute totalPages correctly", () => {
    const wrapper = mount(PaymentDashboardView, {
      global: {
        stubs: {
          PageHeader: true,
          TableView: true,
          PopupBox: true,
          EditReservation: true,
        },
      },
    });

    wrapper.vm.total = 100;
    wrapper.vm.pageSize = 25;
    expect(wrapper.vm.totalPages).toBe(4);
  });

  it("should clamp goToPage within bounds", async () => {
    const wrapper = mount(PaymentDashboardView, {
      global: {
        stubs: {
          PageHeader: true,
          TableView: true,
          PopupBox: true,
          EditReservation: true,
        },
      },
    });

    wrapper.vm.total = 100;
    wrapper.vm.pageSize = 25;
    wrapper.vm.page = 2;

    await wrapper.vm.goToPage(0);
    expect(wrapper.vm.page).toBe(1);

    await wrapper.vm.goToPage(10);
    expect(wrapper.vm.page).toBe(4);

    await wrapper.vm.goToPage(2);
    expect(wrapper.vm.page).toBe(2);
  });

  it("should not change page when target equals current", async () => {
    const wrapper = mount(PaymentDashboardView, {
      global: {
        stubs: {
          PageHeader: true,
          TableView: true,
          PopupBox: true,
          EditReservation: true,
        },
      },
    });

    wrapper.vm.total = 100;
    wrapper.vm.pageSize = 25;
    wrapper.vm.page = 1;

    await wrapper.vm.goToPage(1);
    expect(wrapper.vm.page).toBe(1);
  });
});
