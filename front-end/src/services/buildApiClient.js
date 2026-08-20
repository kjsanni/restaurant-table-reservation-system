import axios from "axios";
import { useAuthStore } from "@/stores/auth";

let refreshing = false;
const refreshQueue = [];

const processQueue = (error) => {
  refreshQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  refreshQueue.length = 0;
};

const attachTenantHeader = (config) => {
  const authStore = useAuthStore();
  if (authStore.currentTenant) {
    config.headers["X-Tenant-Id"] = authStore.currentTenant.id;
  }
  return config;
};

const buildRefreshInterceptor = (apiInstance) => {
  const response = async (error) => {
    const authStore = useAuthStore();
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const isLogout = originalRequest.url?.includes("/auth/logout");
      const isRefresh = originalRequest.url?.includes("/auth/refresh-token");
      if (isLogout || isRefresh) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      if (refreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then(() => apiInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      refreshing = true;
      try {
        await authStore.refreshToken();
        processQueue();
        return apiInstance(originalRequest);
      } catch (err) {
        authStore.logout();
        processQueue(err);
        return Promise.reject(error);
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(error);
  };

  return { request: null, response };
};

export const buildApiClient = (baseURL, options = {}) => {
  if (
    typeof baseURL !== "string" ||
    !baseURL.startsWith("/") ||
    baseURL.includes("http://") ||
    baseURL.includes("https://")
  ) {
    throw new Error("Invalid baseURL: must be a relative API path");
  }

  const {
    withRefresh = true,
    withTenantHeader = true,
    withAuthHeader = false,
    onError = null,
    headers = {},
  } = options;

  const client = axios.create({
    baseURL,
    withCredentials: true,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "x-xsrf-token",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (withTenantHeader) {
    client.interceptors.request.use(attachTenantHeader);
  }

  if (withAuthHeader) {
    client.interceptors.request.use((config) => {
      const authStore = useAuthStore();
      if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`;
      }
      return config;
    });
  }

  if (withRefresh) {
    const refreshInterceptors = buildRefreshInterceptor(client);
    client.interceptors.response.use(
      (response) => response,
      refreshInterceptors.response
    );
  }

  if (onError) {
    client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          onError(error);
        }
        return Promise.reject(error);
      }
    );
  }

  return client;
};

export default buildApiClient;
