import API from "./API";

class ShiftAPI {
  getShifts(params = {}) {
    const query = new URLSearchParams();
    if (params.dayOfWeek) query.set("dayOfWeek", params.dayOfWeek);
    if (params.locationId) query.set("locationId", params.locationId);
    const qs = query.toString();
    return API.get("/shifts" + (qs ? "?" + qs : ""));
  }
  getStaff(params = {}) {
    const query = new URLSearchParams();
    if (params.locationId) query.set("locationId", params.locationId);
    const qs = query.toString();
    return API.get("/shifts/staff" + (qs ? "?" + qs : ""));
  }
  createShift(payload) {
    return API.post("/shifts", payload);
  }
  deleteShift(id) {
    return API.delete("/shifts/" + id);
  }
}

export default new ShiftAPI();
