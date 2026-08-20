import { buildApiClient } from "./buildApiClient";
import { useRouter } from "vue-router";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const router = useRouter();

const client = buildApiClient(`${API_BASE}/admin/payments`, {
  onError: (error) => {
    if (error.response?.status === 401) {
      router.push("/login");
    }
  },
});

export const getSummary = (params = {}) => client.get("/summary", { params });

export default {
  getSummary,
};
