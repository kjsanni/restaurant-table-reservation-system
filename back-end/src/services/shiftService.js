const shiftDAO = require("../DAOs/shift.dao");

const createShift = async (payload, tenantId) => shiftDAO.createShift(payload, tenantId);
const getShiftsByDay = async (dayOfWeek, tenantId) => shiftDAO.getShiftsByDay(dayOfWeek, tenantId);
const deleteShift = async (id, tenantId) => shiftDAO.deleteShift(id, tenantId);
const getAllStaff = async (tenantId) => shiftDAO.getAllStaff(tenantId);

module.exports = {
  createShift,
  getShiftsByDay,
  deleteShift,
  getAllStaff,
};
