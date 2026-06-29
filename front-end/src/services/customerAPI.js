import API from "./API";

class CustomerAPI {
  getCustomer(customerId) {
    return API.get("/customers/" + customerId);
  }
  getProfile(customerId) {
    return API.get("/customers/" + customerId + "/profile");
  }
  updateTags(customerId, tags) {
    return API.patch("/customers/" + customerId, { tags });
  }
  findOrCreate(customerData) {
    return API.post("/customers/find-or-create", customerData);
  }
}

export default new CustomerAPI();
