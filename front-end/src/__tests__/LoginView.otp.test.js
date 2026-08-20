import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import LoginView from "@/views/LoginView.vue";

vi.mock("vue-router", () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  RouterLink: {
    template: "<a><slot /></a>",
    props: ["to"],
  },
}));

vi.mock("@/composables/useTurnstileConfig", () => ({
  useTurnstileConfig: () => ({
    config: { enabled: false, siteKey: null },
  }),
}));

const mockLogin = vi.fn();
const mockLoginWithTOTP = vi.fn();
const mockLoginWithWhatsAppOTP = vi.fn();

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({
    login: mockLogin,
    loginWithTOTP: mockLoginWithTOTP,
    loginWithWhatsAppOTP: mockLoginWithWhatsAppOTP,
  }),
}));

describe("LoginView", () => {
  beforeEach(() => {
    vi.resetModules();
    mockLogin.mockReset();
    mockLoginWithTOTP.mockReset();
    mockLoginWithWhatsAppOTP.mockReset();
  });

  it("shows email/password form by default", () => {
    const wrapper = mount(LoginView, {
      props: { mode: "tenant" },
    });

    expect(wrapper.find("#email").exists()).toBe(true);
    expect(wrapper.find("#password").exists()).toBe(true);
    expect(wrapper.find("#totp").exists()).toBe(false);
    expect(wrapper.find("#whatsapp-otp").exists()).toBe(false);
  });

  it("shows TOTP form when pendingTOTP is true", async () => {
    const wrapper = mount(LoginView, {
      props: { mode: "tenant" },
    });

    await wrapper.setData({ pendingTOTP: true });

    expect(wrapper.find("#totp").exists()).toBe(true);
    expect(wrapper.find("#whatsapp-otp").exists()).toBe(false);
    expect(wrapper.find("#email").exists()).toBe(false);
  });

  it("shows WhatsApp OTP form when pendingWhatsAppOTP is true", async () => {
    const wrapper = mount(LoginView, {
      props: { mode: "tenant" },
    });

    await wrapper.setData({ pendingWhatsAppOTP: true });

    expect(wrapper.find("#whatsapp-otp").exists()).toBe(true);
    expect(wrapper.find("#totp").exists()).toBe(false);
    expect(wrapper.find("#email").exists()).toBe(false);
  });

  it("calls loginWithWhatsAppOTP when WhatsApp OTP form is submitted", async () => {
    const wrapper = mount(LoginView, {
      props: { mode: "tenant" },
    });

    await wrapper.setData({
      pendingWhatsAppOTP: true,
      tempToken: "temp-token",
      whatsappOtpToken: "123456",
    });

    await wrapper.find("form").trigger("submit");

    expect(mockLoginWithWhatsAppOTP).toHaveBeenCalledWith(
      "temp-token",
      "123456"
    );
  });
});
