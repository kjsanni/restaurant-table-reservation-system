import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

const client = axios.create({
  baseURL: `${API_BASE}/public/tenants`,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getBySlug = async (slug) => {
  const response = await client.get(`/${encodeURIComponent(slug)}`);
  return response;
};

export default {
  getBySlug,
};
