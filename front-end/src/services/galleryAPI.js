import API from "./API";

class GalleryAPI {
  getAll(params = {}) {
    return API.get("/salon/gallery", { params });
  }
  create(payload) {
    return API.post("/salon/gallery", payload);
  }
  delete(id) {
    return API.delete(`/salon/gallery/${id}`);
  }
}

export default new GalleryAPI();
