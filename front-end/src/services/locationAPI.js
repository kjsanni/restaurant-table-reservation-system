import API from "./API";

class LocationAPI {
  getLocations(params = {}) {
    return API.get("/salon/locations", { params });
  }
  getLocation(id) {
    return API.get(`/salon/locations/${id}`);
  }
  createLocation(payload) {
    return API.post("/salon/locations", payload);
  }
  updateLocation(id, payload) {
    return API.patch(`/salon/locations/${id}`, payload);
  }
  deleteLocation(id) {
    return API.delete(`/salon/locations/${id}`);
  }
}

export default new LocationAPI();
