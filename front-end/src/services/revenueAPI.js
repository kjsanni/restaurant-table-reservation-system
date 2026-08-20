import { buildApiClient } from "./buildApiClient";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const client = buildApiClient(`${API_BASE}/admin/revenue`);

export const getMrrTrends = (months = 12) =>
  client.get("/mrr-trends", { params: { months } });
export const getRevenueByPlan = () => client.get("/by-plan");
export const getLtv = () => client.get("/ltv");
export const getCohortAnalysis = (months = 12) =>
  client.get("/cohorts", { params: { months } });
export const getFeatureAdoption = () => client.get("/feature-adoption");
export const getGeographicDistribution = () => client.get("/geographic");

export default {
  getMrrTrends,
  getRevenueByPlan,
  getLtv,
  getCohortAnalysis,
  getFeatureAdoption,
  getGeographicDistribution,
};
