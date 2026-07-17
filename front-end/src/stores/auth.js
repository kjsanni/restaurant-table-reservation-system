import { defineStore } from "pinia";
import { ref, computed, onMounted } from "vue";
import authAPI from "@/services/authAPI";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const isAuthenticated = computed(() => !!user.value);
  const isLoading = ref(true);
  const currentTenant = ref(null);

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
    return response.data.settings;
  };

  const fetchRegistrationStatus = async () => {
    const response = await authAPI.getRegistrationStatus();
    return response.data.registrationEnabled;
  };

  const updateSettings = async (key, value) => {
    const response = await authAPI.updateSettings(key, value);
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
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    currentTenant,
    login,
    register,
    logout,
    getMe,
    fetchSettings,
    fetchRegistrationStatus,
    updateSettings,
    setTenant,
    clearTenant,
  };
});
