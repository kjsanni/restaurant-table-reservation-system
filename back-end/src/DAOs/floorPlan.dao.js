const db = require("../db/models");
const FloorPlan = db.floorPlan;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : {});

const createFloorPlan = async ({ name }, tenantId) => {
  return await FloorPlan.create({ name, ...withTenant({}, tenantId) });
};

const getFloorPlans = async (tenantId) => {
  return await FloorPlan.findAll({
    where: withTenant({}, tenantId),
    order: [["id", "ASC"]],
  });
};

const deleteFloorPlan = async (id, tenantId) => {
  const fp = await FloorPlan.findOne({ where: withTenant({ id }, tenantId) });
  if (!fp) throw { status: 404, message: "Floor plan not found!" };
  await fp.destroy();
  return { id };
};

module.exports = {
  createFloorPlan,
  getFloorPlans,
  deleteFloorPlan,
};
