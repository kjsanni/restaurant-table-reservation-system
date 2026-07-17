const db = require("../db/models");
const FloorPlan = db.floorPlan;

const createFloorPlan = async ({ name }) => {
  return await FloorPlan.create({ name });
};

const getFloorPlans = async () => {
  return await FloorPlan.findAll({ order: [["id", "ASC"]] });
};

const deleteFloorPlan = async (id) => {
  const fp = await FloorPlan.findByPk(id);
  if (!fp) throw { status: 404, message: "Floor plan not found!" };
  await fp.destroy();
  return { id };
};

module.exports = {
  createFloorPlan,
  getFloorPlans,
  deleteFloorPlan,
};
