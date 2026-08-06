import API from "./API";

class SalonReportsAPI {
  getRevenueByService(from, to) {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    return API.get("/salon/reports", { params });
  }

  exportCsv(from, to) {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    return API.get("/salon/reports/export/csv", {
      params,
      responseType: "blob",
    });
  }

  listScheduledReports() {
    return API.get("/salon/scheduled-reports");
  }

  createScheduledReport(payload) {
    return API.post("/salon/scheduled-reports", payload);
  }

  updateScheduledReport(id, payload) {
    return API.patch(`/salon/scheduled-reports/${id}`, payload);
  }

  deleteScheduledReport(id) {
    return API.delete(`/salon/scheduled-reports/${id}`);
  }

  runScheduledReport(id) {
    return API.post(`/salon/scheduled-reports/${id}/run`);
  }
}

export default new SalonReportsAPI();
