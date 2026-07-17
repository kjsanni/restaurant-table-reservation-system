import API from "./API";

class TimeOffAPI {
  getTimeOffs(status) {
    return API.get("/time-offs" + (status ? "?status=" + status : ""));
  }
  getStaff() {
    return API.get("/time-offs/staff");
  }
  createTimeOff(payload) {
    return API.post("/time-offs", payload);
  }
  updateStatus(id, status) {
    return API.patch("/time-offs/" + id, { status });
  }
  deleteTimeOff(id) {
    return API.delete("/time-offs/" + id);
  }
}

export default new TimeOffAPI();
