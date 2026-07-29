import API from "./API";

class CustomerPortalAPI {
  getProfile() {
    return API.get("/customer-portal/profile");
  }

  updateProfile(data) {
    return API.patch("/customer-portal/profile", data);
  }

  getReservations() {
    return API.get("/customer-portal/reservations");
  }

  cancelReservation(reservationId) {
    return API.post(`/customer-portal/reservations/${reservationId}/cancel`);
  }

  getWaitlist() {
    return API.get("/customer-portal/waitlist");
  }

  joinWaitlist(data) {
    return API.post("/customer-portal/waitlist", data);
  }

  cancelWaitlistEntry(id) {
    return API.post(`/customer-portal/waitlist/${id}/cancel`);
  }

  getLoyalty() {
    return API.get("/customer-portal/loyalty");
  }

  redeemLoyaltyPoints(points) {
    return API.post("/customer-portal/loyalty/redeem", { points });
  }

  getPromotions() {
    return API.get("/customer-portal/promotions");
  }

  getPromotion(promotionId) {
    return API.get(`/customer-portal/promotions/${promotionId}`);
  }
}

export default new CustomerPortalAPI();
