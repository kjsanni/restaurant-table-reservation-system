const timeOffDAO = require("../DAOs/timeOff.dao");

const createTimeOff = async (payload) => timeOffDAO.createTimeOff(payload);
const getTimeOffs = async (status) => timeOffDAO.getTimeOffs(status);
const updateTimeOffStatus = async (id, status) => timeOffDAO.updateTimeOffStatus(id, status);
const deleteTimeOff = async (id) => timeOffDAO.deleteTimeOff(id);
const getAllStaff = async () => timeOffDAO.getAllStaff();

module.exports = {
  createTimeOff,
  getTimeOffs,
  updateTimeOffStatus,
  deleteTimeOff,
  getAllStaff,
};
