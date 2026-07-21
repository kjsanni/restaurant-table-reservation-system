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
  const schedules = await scheduleDAO.getAllSchedules(req.tenant?.id);
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
  }, req.tenant?.id);

  req.app.get("io").emit("schedule-updated", { action: "create", schedule });

  return res.status(201).json({
    success: true,
    message: "Schedule created successfully!",
    schedule,
  });
};

const updateScheduleHandler = async (req, res) => {
  const { id } = req.params;
  const result = await scheduleDAO.updateSchedule(id, req.body, req.tenant?.id);

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
  const result = await scheduleDAO.deleteSchedule(id, req.tenant?.id);

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
  const holidays = await scheduleDAO.getAllHolidays(req.tenant?.id);
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
  }, req.tenant?.id);

  req.app.get("io").emit("holiday-updated", { action: "create", holiday });

  return res.status(201).json({
    success: true,
    message: "Holiday created successfully!",
    holiday,
  });
};

const deleteHolidayHandler = async (req, res) => {
  const { id } = req.params;
  const result = await scheduleDAO.deleteHoliday(id, req.tenant?.id);

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
  const schedules = await scheduleDAO.getAllSchedules(req.tenant?.id);
  const holidays = await scheduleDAO.getAllHolidays(req.tenant?.id);

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
  const schedules = await scheduleDAO.getAllSchedules(req.tenant?.id);
  const holidays = await scheduleDAO.getAllHolidays(req.tenant?.id);

  const html = `
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Restaurant Schedule</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 16px; margin-top: 18px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
          th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; font-size: 13px; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>Restaurant Schedule</h1>
        <h2>Weekly Hours</h2>
        <table>
          <tr><th>Day</th><th>Open</th><th>Close</th><th>Slots</th><th>Status</th></tr>
          ${schedules.map(s => `<tr><td>${escapeHtml(s.dayOfWeek)}</td><td>${escapeHtml(s.openTime)}</td><td>${escapeHtml(s.closeTime)}</td><td>${escapeHtml(s.slotDuration)} min</td><td>${escapeHtml(s.isClosed ? "Closed" : "Open")}</td></tr>`).join("")}
        </table>

        <h2>Holidays</h2>
        <table>
          <tr><th>Date</th><th>Open</th><th>Close</th><th>Status</th><th>Description</th></tr>
          ${holidays.map(h => `<tr><td>${escapeHtml(h.date)}</td><td>${escapeHtml(h.openTime || "-")}</td><td>${escapeHtml(h.closeTime || "-")}</td><td>${escapeHtml(h.isClosed ? "Closed" : "Special Hours")}</td><td>${escapeHtml(h.description || "")}</td></tr>`).join("")}
        </table>
      </body>
    </html>
  `;

  let browser = null;
  try {
    const puppeteer = require("puppeteer");
    browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=schedule-export.pdf");
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch {}
    }
    console.error("PDF export failed:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
    });
  }
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
