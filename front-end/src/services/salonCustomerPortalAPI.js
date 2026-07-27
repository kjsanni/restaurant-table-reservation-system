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
  rebookAppointment(appointmentId) {
    return API.post(
      `/salon/customer-portal/appointments/${appointmentId}/rebook`
    );
  }
  getGiftCards() {
    return API.get("/salon/customer-portal/gift-cards");
  }
  getReferrals() {
    return API.get("/salon/customer-portal/referrals");
  }
  getPackages() {
    return API.get("/salon/customer-portal/packages");
  }
  getPricingRules() {
    return API.get("/salon/customer-portal/pricing-rules");
  }
}

export default new SalonCustomerPortalAPI();
