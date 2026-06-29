const scheduleDAO = require("../DAOs/schedule.dao");

const escapeHtml = (str) => {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
};

const escapeCsv = (str) => {
  if (!str) return "";
  const s = String(str);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
};

const getAllSchedulesHandler = async (req, res) => {
  const schedules = await scheduleDAO.getAllSchedules();
  return res.status(200).json({
    success: true,
    schedules,
  });
};

const createScheduleHandler = async (req, res) => {
  const { dayOfWeek, openTime, closeTime, isClosed, slotDuration } = req.body;

  if (!dayOfWeek || !openTime || !closeTime) {
    throw {
      status: 400,
      message: "Please provide dayOfWeek, openTime, and closeTime!",
    };
  }

  const schedule = await scheduleDAO.createSchedule({
    dayOfWeek,
    openTime,
    closeTime,
    isClosed: isClosed || false,
    slotDuration: slotDuration || 30,
  });

  req.app.get("io").emit("schedule-updated", { action: "create", schedule });

  return res.status(201).json({
    success: true,
    message: "Schedule created successfully!",
    schedule,
  });
};

const updateScheduleHandler = async (req, res) => {
  const { id } = req.params;
  const result = await scheduleDAO.updateSchedule(id, req.body);

  if (!result) {
    throw { status: 404, message: "Schedule not found!" };
  }

  req.app.get("io").emit("schedule-updated", { action: "update", id });

  return res.status(200).json({
    success: true,
    message: "Schedule updated successfully!",
  });
};

const deleteScheduleHandler = async (req, res) => {
  const { id } = req.params;
  const result = await scheduleDAO.deleteSchedule(id);

  if (!result) {
    throw { status: 404, message: "Schedule not found!" };
  }

  req.app.get("io").emit("schedule-updated", { action: "delete", id });

  return res.status(200).json({
    success: true,
    message: "Schedule deleted successfully!",
  });
};

const getAllHolidaysHandler = async (req, res) => {
  const holidays = await scheduleDAO.getAllHolidays();
  return res.status(200).json({
    success: true,
    holidays,
  });
};

const createHolidayHandler = async (req, res) => {
  const { date, description, isClosed, openTime, closeTime } = req.body;

  if (!date) {
    throw {
      status: 400,
      message: "Please provide a date!",
    };
  }

  const holiday = await scheduleDAO.createHoliday({
    date,
    description,
    isClosed: isClosed !== false,
    openTime,
    closeTime,
  });

  req.app.get("io").emit("holiday-updated", { action: "create", holiday });

  return res.status(201).json({
    success: true,
    message: "Holiday created successfully!",
    holiday,
  });
};

const deleteHolidayHandler = async (req, res) => {
  const { id } = req.params;
  const result = await scheduleDAO.deleteHoliday(id);

  if (!result) {
    throw { status: 404, message: "Holiday not found!" };
  }

  req.app.get("io").emit("holiday-updated", { action: "delete", id });

  return res.status(200).json({
    success: true,
    message: "Holiday deleted successfully!",
  });
};

const exportScheduleCSVHandler = async (req, res) => {
  const schedules = await scheduleDAO.getAllSchedules();
  const holidays = await scheduleDAO.getAllHolidays();

  let csv = "Type,Day/Date,Open Time,Close Time,Status,Description\n";

  schedules.forEach((s) => {
    csv += `Schedule,${escapeCsv(s.dayOfWeek)},${escapeCsv(s.openTime)},${escapeCsv(s.closeTime)},${escapeCsv(s.isClosed ? "Closed" : "Open")},\n`;
  });

  holidays.forEach((h) => {
    csv += `Holiday,${escapeCsv(h.date)},${escapeCsv(h.openTime || "N/A")},${escapeCsv(h.closeTime || "N/A")},${escapeCsv(h.isClosed ? "Closed" : "Special Hours")},${escapeCsv(h.description)}\n`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=schedule-export.csv");
  return res.status(200).send(csv);
};

const exportSchedulePDFHandler = async (req, res) => {
  const schedules = await scheduleDAO.getAllSchedules();
  const holidays = await scheduleDAO.getAllHolidays();

  let html = "<html><body>";
  html += "<h1>Restaurant Schedule</h1>";
  html += "<h2>Weekly Hours</h2>";
  html += "<table border='1' cellpadding='5'><tr><th>Day</th><th>Open</th><th>Close</th><th>Slots</th><th>Status</th></tr>";

  schedules.forEach((s) => {
    html += `<tr><td>${escapeHtml(s.dayOfWeek)}</td><td>${escapeHtml(s.openTime)}</td><td>${escapeHtml(s.closeTime)}</td><td>${escapeHtml(s.slotDuration)}min</td><td>${escapeHtml(s.isClosed ? "Closed" : "Open")}</td></tr>`;
  });

  html += "</table><h2>Holidays</h2>";
  html += "<table border='1' cellpadding='5'><tr><th>Date</th><th>Open</th><th>Close</th><th>Status</th><th>Description</th></tr>";

  holidays.forEach((h) => {
    html += `<tr><td>${escapeHtml(h.date)}</td><td>${escapeHtml(h.openTime || "-")}</td><td>${escapeHtml(h.closeTime || "-")}</td><td>${escapeHtml(h.isClosed ? "Closed" : "Special Hours")}</td><td>${escapeHtml(h.description)}</td></tr>`;
  });

  html += "</table></body></html>";

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Content-Disposition", "attachment; filename=schedule-export.html");
  return res.status(200).send(html);
};

module.exports = {
  getAllSchedulesHandler,
  createScheduleHandler,
  updateScheduleHandler,
  deleteScheduleHandler,
  getAllHolidaysHandler,
  createHolidayHandler,
  deleteHolidayHandler,
  exportScheduleCSVHandler,
  exportSchedulePDFHandler,
};
