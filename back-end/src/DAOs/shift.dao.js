const db = require("../db/models");
const StaffShift = db.staffShift;
const User = db.user;

const createShift = async ({ userId, dayOfWeek, startTime, endTime, role }) => {
  return await StaffShift.create({ userId, dayOfWeek, startTime, endTime, role });
};

const getShiftsByDay = async (dayOfWeek) => {
  const where = dayOfWeek ? { dayOfWeek } : {};
  return await StaffShift.findAll({
    where,
    include: [{ model: User, attributes: ["id", "username", "role"] }],
    order: [["startTime", "ASC"]],
  });
};

const deleteShift = async (id) => {
  const shift = await StaffShift.findByPk(id);
  if (!shift) throw { status: 404, message: "Shift not found!" };
  await shift.destroy();
  return { id };
};

const getAllStaff = async () => {
  return await User.findAll({
    where: { role: "staff" },
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
