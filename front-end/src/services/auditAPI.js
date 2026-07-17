import API from "./API";

const getAuditLogs = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== "")
  ).toString();
  return API.get(`/audit-logs${qs ? `?${qs}` : ""}`);
};

const getStats = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== "")
  ).toString();
  return API.get(`/audit-logs/stats${qs ? `?${qs}` : ""}`).then(
    (res) => res.data.stats
  );
};

const bulkDelete = (ids) => {
  return API.post("/audit-logs/bulk-delete", { ids });
};

const exportCSV = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== "")
  ).toString();
  return API.get(`/audit-logs/export/csv${qs ? `?${qs}` : ""}`, {
    responseType: "blob",
  });
};

const exportJSON = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== "")
  ).toString();
  return API.get(`/audit-logs/export/json${qs ? `?${qs}` : ""}`, {
    responseType: "blob",
  });
};

export default {
  getAuditLogs,
  getStats,
  bulkDelete,
  exportCSV,
  exportJSON,
};
