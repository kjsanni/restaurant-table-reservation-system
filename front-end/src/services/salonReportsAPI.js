import API from "./API";

class SalonReportsAPI {
  getRevenueByService(from, to) {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    return API.get("/salon/reports", { params });
  }
}

export default new SalonReportsAPI();
