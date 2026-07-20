import API from "./API";

class OrderAPI {
  createOrder(orderData) {
    return API.post("/orders", orderData);
  }

  getOrder(id) {
    return API.get(`/orders/${id}`);
  }

  getOrders(params = {}) {
    return API.get("/orders", { params });
  }

  searchOrders(query) {
    return API.get("/orders/search", { params: { q: query } });
  }

  getCustomerOrders(customerId) {
    return API.get("/customer/orders", { params: { customerId } });
  }

  getReservationOrders(reservationId) {
    return API.get(`/reservations/${reservationId}/orders`);
  }

  cancelOrder(id) {
    return API.post(`/orders/${id}/cancel`);
  }

  applyDiscount(orderId, discountType, discountValue, discountCode) {
    return API.patch(`/orders/${orderId}/discount`, {
      discountType,
      discountValue,
      discountCode,
    });
  }

  getOrderPayments(orderId) {
    return API.get(`/orders/${orderId}/payments`);
  }

  addOrderPayment(orderId, paymentData) {
    return API.post(`/orders/${orderId}/payments`, paymentData);
  }

  initializeOrderPayment(orderId, paymentData) {
    return API.post(`/orders/${orderId}/payments/initialize`, paymentData);
  }

  getOrderStats(params = {}) {
    return API.get("/orders/stats", { params });
  }

  updateOrder(id, data) {
    return API.patch(`/orders/${id}`, data);
  }
}

export default new OrderAPI();
