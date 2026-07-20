import axios from "axios";
import { useAuthStore } from "@/stores/auth";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = axios.create({
  baseURL: `${API_BASE}/admin/plans`,
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "x-xsrf-token",
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (
    import.meta.env.VITE_TENANT_MODE === "enabled" &&
    authStore.currentTenant
  ) {
    config.headers["X-Tenant-Id"] = authStore.currentTenant.id;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const listPlans = (params = {}) => client.get("/", { params });
export const getPlan = (id) => client.get(`/${id}`);
export const createPlan = (data) => client.post("/", data);
export const updatePlan = (id, data) => client.patch(`/${id}`, data);
export const deletePlan = (id) => client.delete(`/${id}`);

export default {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
};
