import API from "./API";

class StationAPI {
  getStations(params = {}) {
    return API.get("/salon/stations", { params });
  }
  getStation(id) {
    return API.get("/salon/stations/" + id);
  }
  createStation(data) {
    return API.post("/salon/stations", data);
  }
  updateStation(id, data) {
    return API.patch("/salon/stations/" + id, data);
  }
  deleteStation(id) {
    return API.delete("/salon/stations/" + id);
  }
  getUtilization(id, params = {}) {
    return API.get("/salon/stations/" + id + "/utilization", { params });
  }
}

export default new StationAPI();
