const timeOffService = require("../services/timeOffService");

const getTimeOffsHandler = async (req, res) => {
  const status = req.query.status;
  const items = await timeOffService.getTimeOffs(status);
  return res.status(200).json({ success: true, timeOffs: items });
};

const getStaffHandler = async (req, res) => {
  const staff = await timeOffService.getAllStaff();
  return res.status(200).json({ success: true, staff });
};

const createHandler = async (req, res) => {
  const { userId, startDate, endDate, reason } = req.body;
  if (!userId || !startDate || !endDate) {
    throw { status: 400, message: "userId, startDate and endDate are required!" };
  }
  const item = await timeOffService.createTimeOff({ userId, startDate, endDate, reason });
  return res.status(201).json({ success: true, timeOff: item });
};

const updateStatusHandler = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const item = await timeOffService.updateTimeOffStatus(id, status);
  return res.status(200).json({ success: true, timeOff: item });
};

const deleteHandler = async (req, res) => {
  const { id } = req.params;
  const result = await timeOffService.deleteTimeOff(id);
  return res.status(200).json({ success: true, item: result });
};

module.exports = {
  getTimeOffsHandler,
  getStaffHandler,
  createHandler,
  updateStatusHandler,
  deleteHandler,
};
