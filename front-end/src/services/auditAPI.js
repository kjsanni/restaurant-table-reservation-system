import API from "./API";

const getAuditLogs = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== "")
  ).toString();
  return API.get(`/audit-logs${qs ? `?${qs}` : ""}`);
};

export default {
  getAuditLogs,
};
