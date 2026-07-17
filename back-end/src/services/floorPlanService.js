const floorPlanDAO = require("../DAOs/floorPlan.dao");

const createFloorPlan = async (payload, tenantId) => floorPlanDAO.createFloorPlan(payload, tenantId);
const getFloorPlans = async (tenantId) => floorPlanDAO.getFloorPlans(tenantId);
const deleteFloorPlan = async (id, tenantId) => floorPlanDAO.deleteFloorPlan(id, tenantId);

module.exports = {
  createFloorPlan,
  getFloorPlans,
  deleteFloorPlan,
};
