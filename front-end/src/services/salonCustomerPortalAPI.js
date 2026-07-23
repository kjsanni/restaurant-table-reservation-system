import API from "./API";

class SalonCustomerPortalAPI {
  getProfile() {
    return API.get("/salon/customer-portal/profile");
  }
  getAppointments() {
    return API.get("/salon/customer-portal/appointments");
  }
  cancelAppointment(appointmentId) {
    return API.post(
      `/salon/customer-portal/appointments/${appointmentId}/cancel`
    );
  }
}

export default new SalonCustomerPortalAPI();
