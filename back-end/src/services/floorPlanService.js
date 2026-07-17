const floorPlanDAO = require("../DAOs/floorPlan.dao");

const createFloorPlan = async (payload) => floorPlanDAO.createFloorPlan(payload);
const getFloorPlans = async () => floorPlanDAO.getFloorPlans();
const deleteFloorPlan = async (id) => floorPlanDAO.deleteFloorPlan(id);

module.exports = {
  createFloorPlan,
  getFloorPlans,
  deleteFloorPlan,
};
