import { defineStore } from "pinia";
import { ref, computed, onMounted } from "vue";
import authAPI from "@/services/authAPI";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const isAuthenticated = computed(() => !!user.value);
  const isLoading = ref(true);
  const currentTenant = ref(null);
  const tenantModeEnabled = ref(false);
  const branding = ref({ brandName: "", logoUrl: "", primaryColor: "" });
  const currencyLocale = ref({ currency: "GHS", locale: "en-GH" });

  const applySetting = (settings, key, target) => {
    const s = settings.find((d) => d.key === key);
    if (!s || s.value == null) return;
    const v = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
    if (v && typeof v === "object") Object.assign(target, v);
  };

  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    user.value = response.data.user;
    return response;
  };

  const register = async (username, email, password) => {
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
        (s) => s.key === "tenant_mode_enabled"
      );
      if (setting) {
        const v =
          typeof setting.value === "string"
            ? JSON.parse(setting.value)
            : setting.value;
        tenantModeEnabled.value = Boolean(v);
      }
      applySetting(settings.data.settings, "branding", branding.value);
      applySetting(settings.data.settings, "currency_locale", currencyLocale.value);
    } catch {
      tenantModeEnabled.value = false;
    }
    return tenantModeEnabled.value;
  };

  const fetchRegistrationStatus = async () => {
    const response = await authAPI.getRegistrationStatus();
    return response.data.registrationEnabled;
  };

  const updateSettings = async (key, value) => {
    const response = await authAPI.updateSettings(key, value);
    if (key === "tenant_mode_enabled") {
      tenantModeEnabled.value = Boolean(value);
    }
    return response.data.setting;
  };

  const setTenant = (tenant) => {
    currentTenant.value = tenant;
  };

  const clearTenant = () => {
    currentTenant.value = null;
  };

  onMounted(async () => {
    try {
      await getMe();
    } catch {
      // not authenticated
    }
    isLoading.value = false;
    fetchTenantMode();
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    currentTenant,
    tenantModeEnabled,
    branding,
    currencyLocale,
    login,
    register,
    logout,
    getMe,
    fetchSettings,
    fetchTenantMode,
    fetchRegistrationStatus,
    updateSettings,
    setTenant,
    clearTenant,
  };
});
