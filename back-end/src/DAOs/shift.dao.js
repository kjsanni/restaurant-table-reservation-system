const db = require("../db/models");
const StaffShift = db.staffShift;
const User = db.user;

const withTenant = (where = {}, tenantId) => {
  if (!tenantId) {
    console.warn(`[tenant-scoping] ${require("path").basename(module.filename)}: withTenant called without tenantId — tenant filter dropped`);
  }
  return tenantId ? { ...where, tenantId } : where;
};

const createShift = async ({ userId, dayOfWeek, startTime, endTime, role, locationId }, tenantId) => {
  return await StaffShift.create({ userId, dayOfWeek, startTime, endTime, role, locationId, ...withTenant({}, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
};

const getShiftsByDay = async (dayOfWeek, tenantId, locationId) => {
  const where = withTenant(dayOfWeek ? { dayOfWeek } : {}, tenantId);
  if (locationId) where.locationId = locationId;
  return await StaffShift.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    include: [
      { model: User, attributes: ["id", "username", "role"] },
      { model: db.location, as: "location", attributes: ["id", "name"] },
    ],
    order: [["startTime", "ASC"]],
  });
};

const deleteShift = async (id, tenantId) => {
// codacy-suppress NoSqlInjection
  const shift = await StaffShift.findOne({ where: withTenant({ id }, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
  if (!shift) throw { status: 404, message: "Shift not found!" };
  await shift.destroy();
  return { id };
};

const getAllStaff = async (tenantId, locationId) => {
  const where = withTenant({ role: "staff" }, tenantId);
  if (locationId) where.locationId = locationId;
  return await User.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    include: [{ model: db.staffShift, as: "shifts", attributes: ["id", "dayOfWeek", "startTime", "endTime"] }],
    attributes: ["id", "username", "role"],
    order: [["username", "ASC"]],
  });
};

module.exports = {
  createShift,
  getShiftsByDay,
  deleteShift,
  getAllStaff,
};
