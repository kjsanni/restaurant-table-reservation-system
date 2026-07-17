import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";

export function useBranding() {
  const authStore = useAuthStore();
  const brandName = computed(() => authStore.branding.brandName || "");
  const logoUrl = computed(() => authStore.branding.logoUrl || "");
  const primaryColor = computed(() => authStore.branding.primaryColor || "");

  return { brandName, logoUrl, primaryColor };
}
