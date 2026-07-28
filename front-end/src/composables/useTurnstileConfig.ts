import { ref, onMounted } from "vue";
import API from "@/services/API";

export interface TurnstileConfig {
  enabled: boolean;
  siteKey: string | null;
}

const turnstileConfig = ref<TurnstileConfig>({
  enabled: false,
  siteKey: null,
});

export const useTurnstileConfig = () => {
  const fetchConfig = async () => {
    try {
      const response = await API.get("/auth/turnstile-config");
      if (response.data?.success && response.data?.config) {
        turnstileConfig.value = response.data.config;
      }
    } catch {
      // If the endpoint fails, default to disabled
      turnstileConfig.value = { enabled: false, siteKey: null };
    }
  };

  onMounted(() => {
    fetchConfig();
  });

  return {
    config: turnstileConfig,
    fetchConfig,
  };
};
