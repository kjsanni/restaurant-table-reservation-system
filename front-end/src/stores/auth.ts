import { defineStore } from "pinia";
import { ref, computed } from "vue";
import authAPI from "@/services/authAPI";

export interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "manager" | "staff";
  permissions?: Record<string, boolean>;
  tenantId?: number;
  isSuperAdmin?: boolean;
}

export interface TenantCapabilities {
  businessVertical?: string;
  restaurantType: string;
  serviceModes: string[];
  featureFlags: Record<string, boolean>;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const isAuthenticated = computed(() => !!user.value);
  const isLoading = ref(true);
  const sessionInitialized = ref(false);
  const currentTenant = ref<{
    id: number;
    name: string;
    slug?: string;
    businessVertical?: string;
    settings?: Record<string, unknown>;
  } | null>(null);

  try {
    const stored = sessionStorage.getItem("currentTenant");
    if (stored) {
      currentTenant.value = JSON.parse(stored) as {
        id: number;
        name: string;
        slug?: string;
        businessVertical?: string;
        settings?: Record<string, unknown>;
      } | null;
    }
  } catch {
    currentTenant.value = null;
  }
  const tenantModeEnabled = ref(false);
  const branding = ref({
    brandName: "",
    logoUrl: "",
    primaryColor: "",
    secondaryColor: "",
  });
  const currencyLocale = ref({ currency: "GHS", locale: "en-GH" });
  const authError = ref<string | null>(null);
  const capabilities = ref<TenantCapabilities | null>(null);
  const entryPoint = ref<"platform" | "tenant" | null>(null);
  const isSuperAdmin = computed(() => !!user.value?.isSuperAdmin);

  const applySetting = (
    settings: Array<{ key: string; value: unknown }>,
    key: string,
    target: Record<string, unknown>
  ) => {
    const s = settings.find((d) => d.key === key);
    if (!s || s.value == null) return;
    let v: unknown;
    try {
      v = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
    } catch {
      console.warn("Failed to parse setting value", key);
      return;
    }
    if (v && typeof v === "object") Object.assign(target, v);
  };

  const login = async (
    email: string,
    password: string,
    entryPointContext?: "platform" | "tenant",
    cfTurnstileToken?: string
  ) => {
    const response = await authAPI.login(email, password, cfTurnstileToken);
    if (!response.data.requiresEmailVerification) {
      user.value = response.data.user;
    }
    entryPoint.value = entryPointContext || null;
    return response.data;
  };

  const loginWithTOTP = async (tempToken: string, token: string) => {
    const response = await authAPI.loginWithTOTP(tempToken, token);
    user.value = response.data.user;
    return response.data;
  };

  const loginWithWhatsAppOTP = async (tempToken: string, code: string) => {
    const response = await authAPI.loginWithWhatsAppOTP(tempToken, code);
    user.value = response.data.user;
    return response.data;
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    cfTurnstileToken?: string
  ) => {
    const response = await authAPI.register(
      username,
      email,
      password,
      cfTurnstileToken
    );
    return response;
  };

  const customerRegister = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string,
    cfTurnstileToken?: string,
    tenantSlug?: string
  ) => {
    const response = await authAPI.registerCustomer(
      email,
      password,
      firstName,
      lastName,
      phone,
      cfTurnstileToken,
      tenantSlug
    );
    if (response?.data?.user && !response.data.requiresVerification) {
      user.value = response.data.user;
    }
    return response;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore logout errors
    }
    user.value = null;
    entryPoint.value = null;
    currentTenant.value = null;
    sessionStorage.removeItem("currentTenant");
  };

  const getMe = async () => {
    const response = await authAPI.getMe();
    user.value = response.data.user;
    if (response.data.user?.tenant) {
      currentTenant.value = response.data.user.tenant;
      sessionStorage.setItem(
        "currentTenant",
        JSON.stringify(response.data.user.tenant)
      );
    }
    return response;
  };

  const fetchSettings = async () => {
    const response = await authAPI.getSettings();
    const settings = response.data.settings;
    applySetting(settings, "branding", branding.value);
    applySetting(settings, "currency_locale", currencyLocale.value);
    return settings;
  };

  const fetchTenantMode = async () => {
    try {
      const settings = await fetchSettings();
      const setting = (settings || []).find(
        (s: { key: string }) => s.key === "tenant_mode_enabled"
      );
      if (setting) {
        const v =
          typeof setting.value === "string"
            ? JSON.parse(setting.value)
            : setting.value;
        tenantModeEnabled.value = Boolean(v);
      }
    } catch {
      tenantModeEnabled.value = false;
    }
    return tenantModeEnabled.value;
  };

  const fetchCapabilities = async () => {
    try {
      const response = await authAPI.getTenantCapabilities();
      capabilities.value = response.data.capabilities;
    } catch {
      capabilities.value = null;
    }
  };

  const refreshToken = async () => {
    const response = await authAPI.refreshToken();
    return response.data;
  };

  const updateSettings = async (key: string, value: unknown) => {
    const response = await authAPI.updateSettings(key, value);
    if (key === "tenant_mode_enabled") {
      tenantModeEnabled.value = Boolean(value);
    }
    return response.data.setting;
  };

  const setTenant = (
    tenant: {
      id: number;
      name: string;
      slug?: string;
      businessVertical?: string;
    } | null
  ) => {
    currentTenant.value = tenant;
    if (tenant) {
      sessionStorage.setItem("currentTenant", JSON.stringify(tenant));
    } else {
      sessionStorage.removeItem("currentTenant");
    }
  };

  const clearTenant = () => {
    currentTenant.value = null;
    sessionStorage.removeItem("currentTenant");
  };

  const fetchRegistrationStatus = async () => {
    const response = await authAPI.getRegistrationStatus();
    return response.data.enabled;
  };

  const init = async () => {
    if (sessionInitialized.value) return;
    sessionInitialized.value = true;
    try {
      const storedTenant = sessionStorage.getItem("currentTenant");
      if (storedTenant) {
        try {
          currentTenant.value = JSON.parse(storedTenant);
        } catch {
          console.warn("Failed to parse stored tenant");
        }
      }
      await Promise.all([
        getMe().catch(() => {}),
        fetchTenantMode().catch(() => {}),
        fetchCapabilities().catch(() => {}),
      ]);
    } catch (err) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 401) {
        authError.value = "Session expired. Please log in again.";
      } else {
        authError.value =
          "Session expired or unreachable. Please log in again.";
      }
      user.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    currentTenant,
    tenantModeEnabled,
    branding,
    currencyLocale,
    authError,
    capabilities,
    entryPoint,
    isSuperAdmin,
    login,
    loginWithTOTP,
    loginWithWhatsAppOTP,
    register,
    customerRegister,
    logout,
    getMe,
    fetchSettings,
    fetchTenantMode,
    fetchCapabilities,
    fetchRegistrationStatus,
    updateSettings,
    setTenant,
    clearTenant,
    refreshToken,
    init,
  };
});
