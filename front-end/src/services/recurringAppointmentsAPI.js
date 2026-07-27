import API from "./API";

class RecurringAppointmentsAPI {
  getAll(params = {}) {
    return API.get("/salon/recurring-appointments", { params });
  }
  create(payload) {
    return API.post("/salon/recurring-appointments", payload);
  }
  update(id, payload) {
    return API.patch(`/salon/recurring-appointments/${id}`, payload);
  }
}

export default new RecurringAppointmentsAPI();
