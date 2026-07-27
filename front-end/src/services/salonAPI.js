import API from "./API";

class SalonAPI {
  getStaff() {
    return API.get("/salon/staff");
  }
}

export default new SalonAPI();
