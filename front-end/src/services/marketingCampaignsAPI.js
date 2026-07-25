import API from "./API";

class MarketingCampaignsAPI {
  getAll(params = {}) {
    return API.get("/salon/marketing-campaigns", { params });
  }
  create(payload) {
    return API.post("/salon/marketing-campaigns", payload);
  }
  update(id, payload) {
    return API.patch(`/salon/marketing-campaigns/${id}`, payload);
  }
  delete(id) {
    return API.delete(`/salon/marketing-campaigns/${id}`);
  }
  send(id) {
    return API.post(`/salon/marketing-campaigns/${id}/send`);
  }
}

export default new MarketingCampaignsAPI();
