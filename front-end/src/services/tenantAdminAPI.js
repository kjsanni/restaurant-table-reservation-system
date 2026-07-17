import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = axios.create({
  baseURL: `${API_BASE}/admin/tenants`,
  headers: {
    "Content-Type": "application/json",
  },
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

export const getDashboard = async () => {
  const response = await client.get("/dashboard");
  return response;
};

export const getAll = async (params = {}) => {
  const response = await client.get("/", { params });
  return response;
};

export const getById = async (id) => {
  const response = await client.get(`/${id}`);
  return response;
};

export const update = async (id, data) => {
  const response = await client.patch(`/${id}`, data);
  return response;
};

export const enable = async (id) => {
  const response = await client.post(`/${id}/enable`);
  return response;
};

export const disable = async (id, data = {}) => {
  const response = await client.post(`/${id}/disable`, data);
  return response;
};

export default {
  getDashboard,
  getAll,
  getById,
  update,
  enable,
  disable,
};
