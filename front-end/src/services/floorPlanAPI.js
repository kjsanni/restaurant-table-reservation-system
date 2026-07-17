import API from "./API";

class FloorPlanAPI {
  getFloorPlans() {
    return API.get("/floor-plans");
  }
  createFloorPlan(name) {
    return API.post("/floor-plans", { name });
  }
  updateFloorPlan(id, data) {
    return API.patch("/floor-plans/" + id, data);
  }
  deleteFloorPlan(id) {
    return API.delete("/floor-plans/" + id);
  }
}

export default new FloorPlanAPI();
