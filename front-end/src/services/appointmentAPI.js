import API from "./API";

class AppointmentAPI {
  getAppointments(params = {}) {
    return API.get("/salon/appointments", { params });
  }
  getAppointment(id) {
    return API.get("/salon/appointments/" + id);
  }
  createAppointment(data) {
    return API.post("/salon/appointments", data);
  }
  updateAppointment(id, data) {
    return API.patch("/salon/appointments/" + id, data);
  }
  deleteAppointment(id) {
    return API.delete("/salon/appointments/" + id);
  }
}

export default new AppointmentAPI();
