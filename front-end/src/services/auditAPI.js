import API from "./API";

const getAuditLogs = () => {
  return API.get("/audit-logs");
};

export default {
  getAuditLogs,
};
