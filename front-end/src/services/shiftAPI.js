import API from "./API";

class ShiftAPI {
  getShifts(dayOfWeek) {
    return API.get("/shifts" + (dayOfWeek ? "?dayOfWeek=" + dayOfWeek : ""));
  }
  getStaff() {
    return API.get("/shifts/staff");
  }
  createShift(payload) {
    return API.post("/shifts", payload);
  }
  deleteShift(id) {
    return API.delete("/shifts/" + id);
  }
}

export default new ShiftAPI();
