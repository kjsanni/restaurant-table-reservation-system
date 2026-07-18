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
}

export default new CustomerPortalAPI();
