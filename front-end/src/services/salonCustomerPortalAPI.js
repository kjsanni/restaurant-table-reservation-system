import API from "./API";

// Base path for salon customer-portal endpoints. Override via the
// VITE_SALON_API_PREFIX env variable if the API is served under a different
// prefix; defaults to the platform's standard path.
const SALON_PORTAL_BASE =
  import.meta.env.VITE_SALON_API_PREFIX || "/salon/customer-portal";

class SalonCustomerPortalAPI {
  getProfile() {
    return API.get(`${SALON_PORTAL_BASE}/profile`);
  }
  getAppointments() {
    return API.get(`${SALON_PORTAL_BASE}/appointments`);
  }
  cancelAppointment(appointmentId) {
    return API.post(
      `${SALON_PORTAL_BASE}/appointments/${appointmentId}/cancel`
    );
  }
  rebookAppointment(appointmentId) {
    return API.post(
      `${SALON_PORTAL_BASE}/appointments/${appointmentId}/rebook`
    );
  }
  getGiftCards() {
    return API.get(`${SALON_PORTAL_BASE}/gift-cards`);
  }
  getReferrals() {
    return API.get(`${SALON_PORTAL_BASE}/referrals`);
  }
  getPackages() {
    return API.get(`${SALON_PORTAL_BASE}/packages`);
  }
  getPricingRules() {
    return API.get(`${SALON_PORTAL_BASE}/pricing-rules`);
  }
}

export default new SalonCustomerPortalAPI();
