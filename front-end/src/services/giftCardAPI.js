import API from "./API";

class GiftCardAPI {
  getCards(params = {}) {
    return API.get("/salon/gift-cards", { params });
  }
  getCard(id) {
    return API.get(`/salon/gift-cards/${id}`);
  }
  createCard(payload) {
    return API.post("/salon/gift-cards", payload);
  }
  updateCard(id, payload) {
    return API.patch(`/salon/gift-cards/${id}`, payload);
  }
  deleteCard(id) {
    return API.delete(`/salon/gift-cards/${id}`);
  }
}

export default new GiftCardAPI();
