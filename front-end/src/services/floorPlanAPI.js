import API from "./API";

class FloorPlanAPI {
  getFloorPlans() {
    return API.get("/floor-plans");
  }
  createFloorPlan(name) {
    return API.post("/floor-plans", { name });
  }
  deleteFloorPlan(id) {
    return API.delete("/floor-plans/" + id);
  }
}

export default new FloorPlanAPI();
