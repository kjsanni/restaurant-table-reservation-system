import API from "./API";

class ReferralAPI {
  getReferrals(params = {}) {
    return API.get("/salon/referrals", { params });
  }
  getReferral(id) {
    return API.get(`/salon/referrals/${id}`);
  }
  createReferral(payload) {
    return API.post("/salon/referrals", payload);
  }
  updateReferral(id, payload) {
    return API.patch(`/salon/referrals/${id}`, payload);
  }
  deleteReferral(id) {
    return API.delete(`/salon/referrals/${id}`);
  }
}

export default new ReferralAPI();
