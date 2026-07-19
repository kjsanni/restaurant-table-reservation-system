const db = require("../db/models");
const TimeOff = db.timeOff;
const User = db.user;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const createTimeOff = async ({ userId, startDate, endDate, reason }, tenantId) => {
  return await TimeOff.create({ userId, startDate, endDate, reason, status: "pending", ...withTenant({}, tenantId) });
};

const getTimeOffs = async (status, tenantId) => {
  const where = withTenant(status ? { status } : {}, tenantId);
  return await TimeOff.findAll({
    where,
    include: [{ model: User, attributes: ["id", "username", "role"] }],
    order: [["startDate", "DESC"]],
  });
};

const updateTimeOffStatus = async (id, status, tenantId) => {
  const t = await TimeOff.findOne({ where: withTenant({ id }, tenantId) });
  if (!t) throw { status: 404, message: "Time-off request not found!" };
  t.status = status;
  await t.save();
  return t;
};

const deleteTimeOff = async (id, tenantId) => {
  const t = await TimeOff.findOne({ where: withTenant({ id }, tenantId) });
  if (!t) throw { status: 404, message: "Time-off request not found!" };
  await t.destroy();
  return { id };
};

const getAllStaff = async (tenantId) =>
  await User.findAll({
    where: withTenant({ role: "staff" }, tenantId),
    attributes: ["id", "username", "role"],
    order: [["username", "ASC"]],
  });

module.exports = {
  createTimeOff,
  getTimeOffs,
  updateTimeOffStatus,
  deleteTimeOff,
  getAllStaff,
};
