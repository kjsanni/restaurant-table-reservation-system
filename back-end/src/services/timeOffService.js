const timeOffDAO = require("../DAOs/timeOff.dao");

const createTimeOff = async (payload, tenantId) => timeOffDAO.createTimeOff(payload, tenantId);
const getTimeOffs = async (status, tenantId) => timeOffDAO.getTimeOffs(status, tenantId);
const updateTimeOffStatus = async (id, status, tenantId) => timeOffDAO.updateTimeOffStatus(id, status, tenantId);
const deleteTimeOff = async (id, tenantId) => timeOffDAO.deleteTimeOff(id, tenantId);
const getAllStaff = async (tenantId) => timeOffDAO.getAllStaff(tenantId);

module.exports = {
  createTimeOff,
  getTimeOffs,
  updateTimeOffStatus,
  deleteTimeOff,
  getAllStaff,
};
