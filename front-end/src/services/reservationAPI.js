import API from "./API";

class ReservationAPI {
  getReservations(params = {}) {
    return API.get("/reservations", { params });
  }
  registerReservation(reservationData) {
    return API.post("/reservations", reservationData);
  }
  editReservation(id, reservationData) {
    return API.patch("/reservations/" + id, reservationData);
  }
  cancelReservation(id) {
    return API.delete("/reservations/" + id);
  }
  chooseTable(id, tableId) {
    return API.post("/reservations/choose-table/" + id, { tableId });
  }
  getReservationsHeatmap() {
    return API.get("/reservations/heatmap");
  }
  bulkCancel(ids) {
    return API.post("/reservations/bulk-cancel", { ids });
  }
  bulkUpdate(ids, updates) {
    return API.post("/reservations/bulk-update", { ids, updates });
  }
  getAssignedStaff(reservationId) {
    return API.get("/reservations/" + reservationId + "/staff");
  }
  assignStaff(reservationId, userId) {
    return API.post("/reservations/" + reservationId + "/staff", { userId });
  }
  unassignStaff(reservationId, userId) {
    return API.delete("/reservations/" + reservationId + "/staff/" + userId);
  }
  getPaymentSummary() {
    return API.get("/reservations/payment-summary");
  }
  getReservationStats(filters = {}) {
    return API.get("/reservations/stats", { params: filters });
  }
  getHeatmapV2(filters = {}) {
    return API.get("/reservations/heatmap-v2", { params: filters });
  }
  search(query) {
    return API.get("/reservations/search", { params: { q: query } });
  }
  getRecurring(filters = {}) {
    return API.get("/reservations/recurring", { params: filters });
  }
  getStatusHistory(reservationId) {
    return API.get("/reservations/" + reservationId + "/status-history");
  }
  getRevenueTimeSeries(params = {}) {
    return API.get("/reservations/revenue/time-series", { params });
  }
}

export default new ReservationAPI();
