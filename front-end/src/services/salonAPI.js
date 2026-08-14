import API from "./API";

class SalonAPI {
  getServices(filters = {}) {
    return API.get("/salon/services", { params: filters });
  }

  getService(id) {
    return API.get(`/salon/services/${id}`);
  }

  getStaff() {
    return API.get("/salon/staff");
  }

  createStaff(payload) {
    return API.post("/salon/staff", payload);
  }

  updateStaff(id, payload) {
    return API.put(`/salon/staff/${id}`, payload);
  }

  deleteStaff(id) {
    return API.delete(`/salon/staff/${id}`);
  }
}

export default new SalonAPI();
