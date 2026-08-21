import axios from "axios";
import { offlineService } from "./offlineService";

export const attachOfflineInterceptor = (
  apiInstance: ReturnType<typeof axios.create>
) => {
  apiInstance.interceptors.request.use((config) => {
    if (typeof window === "undefined") return config;

    const method = config.method?.toLowerCase();
    const isMutation = !["get", "head", "options"].includes(method || "");

    if (isMutation && !navigator.onLine) {
      const url = config.url || "";
      const entityType = url.split("/").filter(Boolean).pop() || "unknown";

      (config as any).__offlineQueued = true;
      (config as any).__offlineEntityType = entityType;

      offlineService.queueMutation({
        entityType,
        entityId:
          config.params?.id || config.data?.id || `pending-${Date.now()}`,
        mutationType: method as any,
        payload: {
          url,
          method: config.method,
          data: config.data,
          params: config.params,
        },
      });
    }

    return config;
  });

  apiInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (typeof window === "undefined") return Promise.reject(error);

      const config = error.config;
      if (!config) return Promise.reject(error);

      if ((config as any).__offlineQueued) {
        return Promise.reject({
          ...error,
          isOffline: true,
          message:
            "You are currently offline. This change will sync when you reconnect.",
        });
      }

      if (!navigator.onLine) {
        return Promise.reject({
          ...error,
          isOffline: true,
          message:
            "You are currently offline. Please try again when connected.",
        });
      }

      return Promise.reject(error);
    }
  );
};
