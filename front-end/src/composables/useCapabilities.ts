import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";

export function useCapabilities() {
  const authStore = useAuthStore();
  const capabilities = computed(() => authStore.capabilities);
  const restaurantType = computed(() => capabilities.value?.restaurantType || "full_service");
  const serviceModes = computed(() => capabilities.value?.serviceModes || []);
  const featureFlags = computed(() => capabilities.value?.featureFlags || {});

  const hasServiceMode = (mode: string) => serviceModes.value.includes(mode);
  const hasFeature = (flag: string) => featureFlags.value[flag] === true;

  return {
    capabilities,
    restaurantType,
    serviceModes,
    featureFlags,
    hasServiceMode,
    hasFeature,
  };
}
