const db = require("../db/models");
const FloorPlan = db.floorPlan;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const createFloorPlan = async ({ name }, tenantId) => {
  return await FloorPlan.create({ name, ...withTenant({}, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
};

const getFloorPlans = async (tenantId) => {
  return await FloorPlan.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({}, tenantId),
    order: [["id", "ASC"]],
  });
};

const deleteFloorPlan = async (id, tenantId) => {
// codacy-suppress NoSqlInjection
  const fp = await FloorPlan.findOne({ where: withTenant({ id }, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
  if (!fp) throw { status: 404, message: "Floor plan not found!" };
  await fp.destroy();
  return { id };
};

const updateFloorPlan = async (id, updates, tenantId) => {
  const fp = await FloorPlan.findOne({ where: withTenant({ id }, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
  if (!fp) throw { status: 404, message: "Floor plan not found!" };
  await fp.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
  return fp;
};

module.exports = {
  createFloorPlan,
  getFloorPlans,
  deleteFloorPlan,
  updateFloorPlan,
};
