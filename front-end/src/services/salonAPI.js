import API from "./API";

class SalonAPI {
  getServices(filters = {}) {
    return API.get("/salon/services", { params: filters });
  }

  getService(id) {
    return API.get(`/salon/services/${id}`);
  }
}

export default new SalonAPI();
