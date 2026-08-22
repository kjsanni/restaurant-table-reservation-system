import API from "./API";

class EventPortalAPI {
  getEvents() {
    return API.get("/events");
  }

  getEvent(eventId) {
    return API.get(`/events/${eventId}`);
  }

  createEvent(data) {
    return API.post("/events", data);
  }

  getTicketTypes(eventId) {
    return API.get(`/events/${eventId}/ticket-types`);
  }

  createTicketType(eventId, data) {
    return API.post(`/events/${eventId}/ticket-types`, data);
  }

  getGuestList(eventId) {
    return API.get(`/events/${eventId}/guests`);
  }

  addGuest(eventId, data) {
    return API.post(`/events/${eventId}/guests`, data);
  }

  getQRCodes(eventId) {
    return API.get(`/events/${eventId}/qr-codes`);
  }

  generateQRCode(eventId, data) {
    return API.post(`/events/${eventId}/qr-codes`, data);
  }

  generateBatchQRCodes(eventId, data) {
    return API.post(`/events/${eventId}/qr-codes/batch`, data);
  }

  getBookings(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return API.get(`/events/bookings${qs ? `?${qs}` : ""}`);
  }

  getBooking(bookingId) {
    return API.get(`/events/bookings/${bookingId}`);
  }

  createBooking(data) {
    return API.post("/events/bookings", data);
  }

  updateBooking(bookingId, data) {
    return API.patch(`/events/bookings/${bookingId}`, data);
  }

  confirmBooking(bookingId) {
    return API.patch(`/events/bookings/${bookingId}`);
  }

  updateEvent(eventId, data) {
    return API.patch(`/events/${eventId}`, data);
  }

  deleteEvent(eventId) {
    return API.delete(`/events/${eventId}`);
  }

  cancelBooking(bookingId) {
    return API.delete(`/events/bookings/${bookingId}`);
  }

  transferBooking(bookingId, data) {
    return API.post(`/events/bookings/${bookingId}/transfer`, data);
  }

  initializePayment(bookingId, email) {
    return API.post(`/events/bookings/${bookingId}/payments/initialize`, {
      email,
    });
  }

  updateGuest(eventId, guestId, data) {
    return API.patch(`/events/${eventId}/guests/${guestId}`, data);
  }

  deleteGuest(eventId, guestId) {
    return API.delete(`/events/${eventId}/guests/${guestId}`);
  }

  updateTicketType(eventId, ticketTypeId, data) {
    return API.patch(`/events/${eventId}/ticket-types/${ticketTypeId}`, data);
  }

  deleteTicketType(eventId, ticketTypeId) {
    return API.delete(`/events/${eventId}/ticket-types/${ticketTypeId}`);
  }

  generateGuestQRCode(eventId, guestId) {
    return API.post(`/events/${eventId}/guests/${guestId}/qr-code`, {});
  }

  checkinToken(token, scannerParams = {}) {
    return API.post(`/events/checkin/${token}`, scannerParams);
  }

  verifyToken(token) {
    return API.get(`/events/checkin/${token}/verify`);
  }

  createSigningRequest(eventId, data) {
    return API.post(`/events/${eventId}/wallet-passes/request`, data);
  }

  createWalletPassRequest(eventId, data) {
    return this.createSigningRequest(eventId, data);
  }

  listRequests(eventId) {
    return API.get(`/events/${eventId}/wallet-passes/requests`);
  }

  listWalletPassRequests(eventId) {
    return this.listRequests(eventId);
  }

  getRequest(eventId, requestId) {
    return API.get(`/events/${eventId}/wallet-passes/requests/${requestId}`);
  }

  getWalletPassRequest(eventId, requestId) {
    return this.getRequest(eventId, requestId);
  }

  uploadEventPhoto(eventId, formData) {
    return API.post(`/events/${eventId}/checkin/photo/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  getPhoto(photoRef) {
    return API.get(`/events/checkin/photo/${photoRef}`);
  }

  getPhotoUrl(photoRef) {
    return `/api/v1/events/checkin/photo/${photoRef}`;
  }

  getWebPass(shortCode) {
    return API.get(`/public/e/${shortCode}`);
  }

  getGooglePayJwt(shortCode) {
    return API.get(`/public/e/${shortCode}`, { params: { format: "google" } });
  }

  listPublicEvents(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return API.get(`/public/events${qs ? `?${qs}` : ""}`);
  }

  getPublicEvent(eventId) {
    return API.get(`/public/events/${eventId}`);
  }

  createPublicBooking(data) {
    return API.post("/public/events/bookings", data);
  }

  initializePublicBookingPayment(bookingId, email) {
    return API.post(
      `/public/events/bookings/${bookingId}/payments/initialize`,
      { email }
    );
  }

  getPublicBooking(bookingId) {
    return API.get(`/public/events/bookings/${bookingId}`);
  }

  listPendingApproval(eventId) {
    return API.get(`/events/${eventId}/wallet-passes/requests/pending`);
  }

  getEventTemplates() {
    return API.get("/events/templates");
  }

  getEventTemplate(id) {
    return API.get(`/events/templates/${id}`);
  }

  createEventTemplate(data) {
    return API.post("/events/templates", data);
  }

  updateEventTemplate(id, data) {
    return API.patch(`/events/templates/${id}`, data);
  }

  deleteEventTemplate(id) {
    return API.delete(`/events/templates/${id}`);
  }

  getEventAnalytics(eventId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return API.get(`/events/${eventId}/analytics${qs ? `?${qs}` : ""}`);
  }

  getEventAnalyticsTrend(eventId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return API.get(`/events/${eventId}/analytics/trend${qs ? `?${qs}` : ""}`);
  }

  approveRequest(eventId, requestId) {
    return API.post(
      `/events/${eventId}/wallet-passes/requests/${requestId}/approve`
    );
  }

  rejectRequest(eventId, requestId) {
    return API.post(
      `/events/${eventId}/wallet-passes/requests/${requestId}/reject`
    );
  }
}

export default new EventPortalAPI();
