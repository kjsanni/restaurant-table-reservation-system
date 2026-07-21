import API from "./API";

class DeliveryAPI {
  getDeliveries(params = {}) {
    return API.get("/deliveries", { params });
  }

  getDelivery(id) {
    return API.get(`/deliveries/${id}`);
  }

  getDeliveriesForOrder(orderId) {
    return API.get(`/deliveries/orders/${orderId}`);
  }

  createDelivery(data) {
    return API.post("/deliveries", data);
  }

  syncDelivery(id) {
    return API.post(`/deliveries/${id}/sync`);
  }

  cancelDelivery(id) {
    return API.post(`/deliveries/${id}/cancel`);
  }

  trackDelivery(trackingNumber) {
    return API.get(`/deliveries/track/${trackingNumber}`);
  }

  getRegions() {
    return API.get("/deliveries/regions");
  }
}

export default new DeliveryAPI();
