import API from "./API";

class ClientSegmentationAPI {
  getSegmentation() {
    return API.get("/salon/client-segmentation/segmentation");
  }
  recordVisit(payload) {
    return API.post("/salon/client-segmentation/record-visit", payload);
  }
  markNoShow(payload) {
    return API.post("/salon/client-segmentation/mark-no-show", payload);
  }
}

export default new ClientSegmentationAPI();
