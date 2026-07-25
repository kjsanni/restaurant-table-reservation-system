import API from "./API";

class PricingRuleAPI {
  getRules(params = {}) {
    return API.get("/salon/pricing", { params });
  }
  getRule(id) {
    return API.get(`/salon/pricing/${id}`);
  }
  createRule(payload) {
    return API.post("/salon/pricing", payload);
  }
  updateRule(id, payload) {
    return API.patch(`/salon/pricing/${id}`, payload);
  }
  deleteRule(id) {
    return API.delete(`/salon/pricing/${id}`);
  }
}

export default new PricingRuleAPI();
