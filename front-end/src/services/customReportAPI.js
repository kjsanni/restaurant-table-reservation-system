import API from "./API";

class CustomReportAPI {
  getSources() {
    return API.get("/custom-reports/sources");
  }

  runReport(config) {
    return API.post("/custom-reports/run", config);
  }

  exportCSV(config) {
    return API.post("/custom-reports/export/csv", config);
  }
}

export default new CustomReportAPI();
