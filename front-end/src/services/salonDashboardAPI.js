import API from "./API";

class SalonDashboardAPI {
  getDashboard() {
    return API.get("/salon/dashboard");
  }
}

export default new SalonDashboardAPI();
