import { buildApiClient } from "./buildApiClient";
import { useRouter } from "vue-router";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const router = useRouter();

const client = buildApiClient(`${API_BASE}/admin/plans`, {
  onError: (error) => {
    if (error.response?.status === 401) {
      router.push("/login");
    }
  },
});

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
