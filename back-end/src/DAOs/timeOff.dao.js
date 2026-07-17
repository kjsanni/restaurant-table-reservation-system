const db = require("../db/models");
const TimeOff = db.timeOff;
const User = db.user;

const createTimeOff = async ({ userId, startDate, endDate, reason }) => {
  return await TimeOff.create({ userId, startDate, endDate, reason, status: "pending" });
};

const getTimeOffs = async (status) => {
  const where = status ? { status } : {};
  return await TimeOff.findAll({
    where,
    include: [{ model: User, attributes: ["id", "username", "role"] }],
    order: [["startDate", "DESC"]],
  });
};

const updateTimeOffStatus = async (id, status) => {
  const t = await TimeOff.findByPk(id);
  if (!t) throw { status: 404, message: "Time-off request not found!" };
  t.status = status;
  await t.save();
  return t;
};

const deleteTimeOff = async (id) => {
  const t = await TimeOff.findByPk(id);
  if (!t) throw { status: 404, message: "Time-off request not found!" };
  await t.destroy();
  return { id };
};

const getAllStaff = async () =>
  await User.findAll({
    where: { role: "staff" },
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
