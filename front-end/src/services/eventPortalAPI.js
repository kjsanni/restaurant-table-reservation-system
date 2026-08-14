import API from "./API";

class EventPortalAPI {
  getEvents() {
    return API.get("/events");
  }

  getEvent(eventId) {
    return API.get(`/events/${eventId}`);
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

  checkinToken(token, scannerParams = {}, headers = {}) {
    return API.post(`/events/checkin/${token}`, scannerParams, { headers });
  }

  getScannerConfig() {
    return API.get(`/events/scanner/config`);
  }

  verifyToken(token) {
    return API.get(`/events/checkin/${token}/verify`);
  }

  createWalletPassRequest(eventId) {
    return API.post(`/events/${eventId}/wallet-passes/request`);
  }

  listWalletPassRequests(eventId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return API.get(
      `/events/${eventId}/wallet-passes/requests${qs ? `?${qs}` : ""}`
    );
  }

  getWalletPassRequest(eventId, requestId) {
    return API.get(`/events/${eventId}/wallet-passes/requests/${requestId}`);
  }
}

export default new EventPortalAPI();
