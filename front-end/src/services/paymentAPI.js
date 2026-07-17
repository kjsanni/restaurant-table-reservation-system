import API from "./API";

class PaymentAPI {
  getPayments(reservationId) {
    return API.get("/reservations/" + reservationId + "/payments");
  }
  addPayment(reservationId, data) {
    return API.post("/reservations/" + reservationId + "/payments", data);
  }
  removePayment(reservationId, paymentId) {
    return API.delete(
      "/reservations/" + reservationId + "/payments/" + paymentId
    );
  }
  getHistory(filters = {}) {
    const params = new URLSearchParams();
    if (filters.from) params.append("from", filters.from);
    if (filters.to) params.append("to", filters.to);
    if (filters.method) params.append("method", filters.method);
    return API.get("/payments/history?" + params.toString());
  }
  getRevenueStats(from, to) {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    return API.get("/payments/revenue?" + params.toString());
  }
  refundPayment(reservationId, paymentId, data) {
    return API.post(
      "/reservations/" + reservationId + "/payments/" + paymentId + "/refund",
      data,
      {
        headers: {
          "Idempotency-Key":
            data.idempotencyKey ||
            `${reservationId}-${paymentId}-${Date.now()}`,
        },
      }
    );
  }
}

export default new PaymentAPI();
