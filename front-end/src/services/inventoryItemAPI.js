import API from "./API";

class InventoryAPI {
  getItems(params = {}) {
    return API.get("/salon/inventory", { params });
  }
  getItem(id) {
    return API.get(`/salon/inventory/${id}`);
  }
  createItem(payload) {
    return API.post("/salon/inventory", payload);
  }
  updateItem(id, payload) {
    return API.patch(`/salon/inventory/${id}`, payload);
  }
  deleteItem(id) {
    return API.delete(`/salon/inventory/${id}`);
  }
  getLowStock() {
    return API.get("/salon/inventory/alerts/low-stock");
  }
}

export default new InventoryAPI();
