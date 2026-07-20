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
  updateCustomer(customerId, data) {
    return API.patch("/customers/" + customerId, data);
  }
  findOrCreate(customerData) {
    return API.post("/customers/find-or-create", customerData);
  }
  incrementVisit(customerId) {
    return API.post("/customers/" + customerId + "/visits");
  }
  addPoints(customerId, points) {
    return API.post("/customers/" + customerId + "/points", { points });
  }
  redeemPoints(customerId, points) {
    return API.post("/customers/" + customerId + "/points/redeem", { points });
  }
  updatePreferences(customerId, preferences) {
    return API.patch("/customers/" + customerId + "/preferences", {
      preferences,
    });
  }
  search(query) {
    return API.get("/customers/search", { params: { q: query } });
  }
  checkWhatsApp(phone) {
    return API.post("/customers/check-whatsapp", { phone });
  }
  sendOtp(payload) {
    return API.post("/customers/send-otp", payload);
  }
  verifyOtp(phone, code) {
    return API.post("/customers/verify-otp", { phone, code });
  }
}

export default new CustomerAPI();
