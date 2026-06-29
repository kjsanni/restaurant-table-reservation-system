import API from "./API";

class ReportAPI {
  getReservationReport(filters = {}) {
    const params = new URLSearchParams();
    if (filters.from) params.append("from", filters.from);
    if (filters.to) params.append("to", filters.to);
    if (filters.paymentStatus)
      params.append("paymentStatus", filters.paymentStatus);
    if (filters.resStatus) params.append("resStatus", filters.resStatus);
    return API.get("/reports/reservations?" + params.toString());
  }
  exportCSV(filters = {}) {
    const params = new URLSearchParams();
    if (filters.from) params.append("from", filters.from);
    if (filters.to) params.append("to", filters.to);
    if (filters.paymentStatus)
      params.append("paymentStatus", filters.paymentStatus);
    if (filters.resStatus) params.append("resStatus", filters.resStatus);
    return API.get("/reports/reservations/csv?" + params.toString());
  }
  exportPDF(filters = {}) {
    const params = new URLSearchParams();
    if (filters.from) params.append("from", filters.from);
    if (filters.to) params.append("to", filters.to);
    if (filters.paymentStatus)
      params.append("paymentStatus", filters.paymentStatus);
    if (filters.resStatus) params.append("resStatus", filters.resStatus);
    return API.get("/reports/reservations/pdf?" + params.toString());
  }
}

export default new ReportAPI();
