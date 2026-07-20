import API from "./API";

class PromotionAPI {
  getPromotions(params = {}) {
    return API.get("/promotions", { params });
  }

  getPromotion(id) {
    return API.get(`/promotions/${id}`);
  }

  createPromotion(data) {
    return API.post("/promotions", data);
  }

  updatePromotion(id, data) {
    return API.patch(`/promotions/${id}`, data);
  }

  deletePromotion(id) {
    return API.delete(`/promotions/${id}`);
  }

  validatePromotion(code, orderTotal) {
    return API.post("/promotions/validate", { code, orderTotal });
  }
}

export default new PromotionAPI();
