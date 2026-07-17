const shiftService = require("../services/shiftService");

const getShiftsHandler = async (req, res) => {
  const dayOfWeek = req.query.dayOfWeek;
  const shifts = await shiftService.getShiftsByDay(dayOfWeek, req.tenant?.id);
  return res.status(200).json({ success: true, shifts });
};

const getStaffHandler = async (req, res) => {
  const staff = await shiftService.getAllStaff(req.tenant?.id);
  return res.status(200).json({ success: true, staff });
};

const createShiftHandler = async (req, res) => {
  const { userId, dayOfWeek, startTime, endTime, role } = req.body;
  if (!userId || !dayOfWeek || !startTime || !endTime) {
    throw { status: 400, message: "userId, dayOfWeek, startTime and endTime are required!" };
  }
  const shift = await shiftService.createShift({ userId, dayOfWeek, startTime, endTime, role }, req.tenant?.id);
  return res.status(201).json({ success: true, shift });
};

const deleteShiftHandler = async (req, res) => {
  const { id } = req.params;
  const result = await shiftService.deleteShift(id, req.tenant?.id);
  return res.status(200).json({ success: true, item: result });
};

module.exports = {
  getShiftsHandler,
  getStaffHandler,
  createShiftHandler,
  deleteShiftHandler,
};
