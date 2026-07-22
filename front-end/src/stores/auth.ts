import { defineStore } from "pinia";
import { ref, computed, onMounted } from "vue";
import authAPI from "@/services/authAPI";

export interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "manager" | "staff";
  permissions?: Record<string, boolean>;
  tenantId?: number;
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
  const currentTenant = ref<{ id: number; name: string; slug?: string; businessVertical?: string } | null>(null);
  const tenantModeEnabled = ref(false);
  const branding = ref({ brandName: "", logoUrl: "", primaryColor: "" });
  const currencyLocale = ref({ currency: "GHS", locale: "en-GH" });
  const authError = ref<string | null>(null);
  const capabilities = ref<TenantCapabilities | null>(null);

  const applySetting = (
    settings: Array<{ key: string; value: unknown }>,
    key: string,
    target: Record<string, unknown>
  ) => {
    const s = settings.find((d) => d.key === key);
    if (!s || s.value == null) return;
    const v = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
    if (v && typeof v === "object") Object.assign(target, v);
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    user.value = response.data.user;
    return response;
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await authAPI.register(username, email, password);
    return response;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore logout errors
    }
    user.value = null;
    currentTenant.value = null;
  };

  const getMe = async () => {
    const response = await authAPI.getMe();
    user.value = response.data.user;
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
      const settings = await authAPI.getSettings();
      const setting = (settings.data.settings || []).find(
        (s: { key: string }) => s.key === "tenant_mode_enabled"
      );
      if (setting) {
        const v =
          typeof setting.value === "string"
            ? JSON.parse(setting.value)
            : setting.value;
        tenantModeEnabled.value = Boolean(v);
      }
      applySetting(settings.data.settings, "branding", branding.value);
      applySetting(
        settings.data.settings,
        "currency_locale",
        currencyLocale.value
      );
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

  const setTenant = (tenant: { id: number; name: string; slug?: string } | null) => {
    currentTenant.value = tenant;
  };

  const clearTenant = () => {
    currentTenant.value = null;
  };

  const fetchRegistrationStatus = async () => {
    const response = await authAPI.getRegistrationStatus();
    return response.data.enabled;
  };

  onMounted(async () => {
    try {
      await getMe();
      await fetchTenantMode();
      await fetchCapabilities();
    } catch (err) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status !== 401) {
        try {
          await getMe();
          await fetchTenantMode();
          await fetchCapabilities();
        } catch {
          authError.value =
            "Session expired or unreachable. Please log in again.";
          user.value = null;
        }
      } else {
        authError.value = "Session expired. Please log in again.";
        user.value = null;
      }
    } finally {
      isLoading.value = false;
    }
  });

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
    login,
    register,
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
  };
});
