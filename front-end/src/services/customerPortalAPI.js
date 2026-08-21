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

  getReviews() {
    return API.get("/customer-portal/reviews");
  }

  createReview(data) {
    return API.post("/customer-portal/reviews", data);
  }

  listSupportTickets(params = {}) {
    return API.get(
      `/customer-portal/support-tickets${buildQueryString(params)}`
    );
  }

  getSupportTicket(id) {
    return API.get(`/customer-portal/support-tickets/${id}`);
  }

  createSupportTicket(data) {
    return API.post("/customer-portal/support-tickets", data);
  }

  listTicketMessages(ticketId) {
    return API.get(`/customer-portal/support-tickets/${ticketId}/messages`);
  }

  sendTicketMessage(ticketId, body) {
    return API.post(`/customer-portal/support-tickets/${ticketId}/messages`, {
      body,
    });
  }

  listTicketAttachments(ticketId) {
    return API.get(`/customer-portal/support-tickets/${ticketId}/attachments`);
  }

  createTicketAttachment(ticketId, data) {
    return API.post(
      `/customer-portal/support-tickets/${ticketId}/attachments`,
      data
    );
  }

  getUnifiedProfile() {
    return API.get("/customer-portal/profile/unified");
  }

  getCrossVerticalHistory() {
    return API.get("/customer-portal/history");
  }

  addLoyaltyPoints(points, source) {
    return API.post("/customer-portal/loyalty/add", { points, source });
  }

  redeemLoyaltyPoints(points) {
    return API.post("/customer-portal/loyalty/redeem", { points });
  }
}

function buildQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export default new CustomerPortalAPI();
