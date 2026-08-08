const shiftDAO = require("../DAOs/shift.dao");

const createShift = async (payload, tenantId) => shiftDAO.createShift(payload, tenantId);
const getShiftsByDay = async (dayOfWeek, tenantId, locationId) => shiftDAO.getShiftsByDay(dayOfWeek, tenantId, locationId);
const deleteShift = async (id, tenantId) => shiftDAO.deleteShift(id, tenantId);
const getAllStaff = async (tenantId, locationId) => shiftDAO.getAllStaff(tenantId, locationId);

module.exports = {
  createShift,
  getShiftsByDay,
  deleteShift,
  getAllStaff,
};
