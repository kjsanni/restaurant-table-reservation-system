import API from "./API";

class MenuAPI {
  getCategories() {
    return API.get("/menu/categories");
  }

  getMenuItems(filters = {}) {
    return API.get("/menu/items", { params: filters });
  }

  getAvailableMenu() {
    return API.get("/menu/available");
  }

  getMenuItemDetail(id) {
    return API.get(`/menu/items/${id}`);
  }
}

export default new MenuAPI();
