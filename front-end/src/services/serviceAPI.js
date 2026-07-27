import API from "./API";

class ServiceAPI {
  getServices(params = {}) {
    return API.get("/salon/services", { params });
  }
  getService(id) {
    return API.get("/salon/services/" + id);
  }
  createService(data) {
    return API.post("/salon/services", data);
  }
  updateService(id, data) {
    return API.patch("/salon/services/" + id, data);
  }
  deleteService(id) {
    return API.delete("/salon/services/" + id);
  }
}

export default new ServiceAPI();
