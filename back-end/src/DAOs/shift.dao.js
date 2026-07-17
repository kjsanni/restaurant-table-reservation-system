const db = require("../db/models");
const StaffShift = db.staffShift;
const User = db.user;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : {});

const createShift = async ({ userId, dayOfWeek, startTime, endTime, role }, tenantId) => {
  return await StaffShift.create({ userId, dayOfWeek, startTime, endTime, role, ...withTenant({}, tenantId) });
};

const getShiftsByDay = async (dayOfWeek, tenantId) => {
  const where = withTenant(dayOfWeek ? { dayOfWeek } : {}, tenantId);
  return await StaffShift.findAll({
    where,
    include: [{ model: User, attributes: ["id", "username", "role"] }],
    order: [["startTime", "ASC"]],
  });
};

const deleteShift = async (id, tenantId) => {
  const shift = await StaffShift.findOne({ where: withTenant({ id }, tenantId) });
  if (!shift) throw { status: 404, message: "Shift not found!" };
  await shift.destroy();
  return { id };
};

const getAllStaff = async (tenantId) => {
  return await User.findAll({
    where: withTenant({ role: "staff" }, tenantId),
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
