import API from "./API";

class PackageAPI {
  getPackages(params = {}) {
    return API.get("/salon/packages", { params });
  }
  getPackage(id) {
    return API.get(`/salon/packages/${id}`);
  }
  createPackage(payload) {
    return API.post("/salon/packages", payload);
  }
  updatePackage(id, payload) {
    return API.patch(`/salon/packages/${id}`, payload);
  }
  deletePackage(id) {
    return API.delete(`/salon/packages/${id}`);
  }
}

export default new PackageAPI();
