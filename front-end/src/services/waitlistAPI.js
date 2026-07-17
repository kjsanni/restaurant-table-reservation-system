import API from "./API";

class WaitlistAPI {
  getEntries(filters = {}) {
    const params = new URLSearchParams();
    if (filters.desiredTime) params.append("desiredTime", filters.desiredTime);
    const qs = params.toString();
    return API.get("/waitlist" + (qs ? "?" + qs : ""));
  }
  getStats() {
    return API.get("/waitlist/stats");
  }
  addEntry(data) {
    return API.post("/waitlist", data);
  }
  seatEntry(id, tableId) {
    return API.post("/waitlist/" + id + "/seat", { tableId });
  }
  cancelEntry(id) {
    return API.post("/waitlist/" + id + "/cancel");
  }
  deleteEntry(id) {
    return API.delete("/waitlist/" + id);
  }
  expireOld() {
    return API.post("/waitlist/maintenance/expire");
  }
  addFromReservation(reservationId) {
    return API.post("/waitlist/from-reservation/" + reservationId);
  }
}

export default new WaitlistAPI();
