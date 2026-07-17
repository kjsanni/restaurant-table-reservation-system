const shiftDAO = require("../DAOs/shift.dao");

const createShift = async (payload) => shiftDAO.createShift(payload);
const getShiftsByDay = async (dayOfWeek) => shiftDAO.getShiftsByDay(dayOfWeek);
const deleteShift = async (id) => shiftDAO.deleteShift(id);
const getAllStaff = async () => shiftDAO.getAllStaff();

module.exports = {
  createShift,
  getShiftsByDay,
  deleteShift,
  getAllStaff,
};
