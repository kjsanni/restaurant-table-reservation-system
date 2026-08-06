"use strict";
const scheduledReportDAO = require("../DAOs/scheduledReport.dao");
const { sendEmail } = require("../services/emailService");
const { exportSalonReportsHandler } = require("../controllers/salon-reports.controller");

const listScheduledReportsHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const items = await scheduledReportDAO.list({ tenantId });
    return res.status(200).json({ success: true, collection: items });
  } catch (err) {
    console.error("listScheduledReportsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load scheduled reports" });
  }
};

const createScheduledReportHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { name, reportType, format, filters, frequency, frequencyDay, frequencyTime, recipients } = req.body;

    if (!name || !reportType || !frequency || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, message: "name, reportType, frequency, and recipients are required" });
    }

    const nextRunAt = computeNextRun(frequency, frequencyDay, frequencyTime);

    const report = await scheduledReportDAO.create({
      tenantId,
      name,
      reportType,
      format: format || "csv",
      filters: filters || null,
      frequency,
      frequencyDay: frequencyDay || null,
      frequencyTime: frequencyTime || "08:00",
      recipients,
      enabled: true,
      nextRunAt,
      createdBy: req.user?.id || null,
    });

    return res.status(201).json({ success: true, item: report });
  } catch (err) {
    console.error("createScheduledReportHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to create scheduled report" });
  }
};

const updateScheduledReportHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const report = await scheduledReportDAO.findById(req.params.id, tenantId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Scheduled report not found" });
    }

    const { name, filters, frequency, frequencyDay, frequencyTime, recipients, enabled } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (filters !== undefined) updates.filters = filters;
    if (frequency !== undefined) updates.frequency = frequency;
    if (frequencyDay !== undefined) updates.frequencyDay = frequencyDay;
    if (frequencyTime !== undefined) updates.frequencyTime = frequencyTime;
    if (recipients !== undefined) updates.recipients = recipients;
    if (enabled !== undefined) updates.enabled = enabled;

    if (frequency || frequencyTime) {
      updates.nextRunAt = computeNextRun(
        frequency || report.frequency,
        frequencyDay !== undefined ? frequencyDay : report.frequencyDay,
        frequencyTime || report.frequencyTime
      );
    }

    const updated = await scheduledReportDAO.update(req.params.id, updates);
    return res.status(200).json({ success: true, item: updated });
  } catch (err) {
    console.error("updateScheduledReportHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update scheduled report" });
  }
};

const deleteScheduledReportHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const report = await scheduledReportDAO.remove(req.params.id, tenantId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Scheduled report not found" });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("deleteScheduledReportHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete scheduled report" });
  }
};

const runScheduledReportHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const report = await scheduledReportDAO.findById(req.params.id, tenantId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Scheduled report not found" });
    }

    await processScheduledReport(report);

    return res.status(200).json({ success: true, message: "Report sent" });
  } catch (err) {
    console.error("runScheduledReportHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to run scheduled report" });
  }
};

const computeNextRun = (frequency, frequencyDay, frequencyTime) => {
  const now = new Date();
  const [hours, minutes] = (frequencyTime || "08:00").split(":").map(Number);
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  if (frequency === "daily") {
    return next;
  }

  if (frequency === "weekly") {
    const targetDay = frequencyDay ?? 1;
    while (next.getDay() !== targetDay) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  if (frequency === "monthly") {
    next.setDate(1);
    next.setMonth(next.getMonth() + 1);
    return next;
  }

  return next;
};

const processScheduledReport = async (report) => {
  const tenantId = report.tenantId;
  const filters = report.filters || {};

  const mockReq = { tenant: { id: tenantId }, query: filters };
  const mockRes = {
    setHeader: () => mockRes,
    status: () => mockRes,
    send: () => mockRes,
  };

  let csv = "";
  mockRes.send = (body) => {
    csv = body;
    return mockRes;
  };

  await exportSalonReportsHandler(mockReq, mockRes);

  const subject = `Scheduled Report: ${report.name}`;
  const html = `<p>Please find attached your scheduled report: <strong>${report.name}</strong>.</p>`;
  const from = process.env.DEFAULT_FROM_EMAIL || "reports@vibespot.tech";

  for (const recipient of report.recipients) {
    await sendEmail({
      to: recipient,
      subject,
      text: `${subject}\n\nReport type: ${report.reportType}\nPeriod: ${filters.from || "N/A"} to ${filters.to || "N/A"}`,
      html,
    });
  }

  const nextRunAt = computeNextRun(report.frequency, report.frequencyDay, report.frequencyTime);
  await scheduledReportDAO.update(report.id, {
    lastRunAt: new Date(),
    nextRunAt,
  });
};

module.exports = {
  listScheduledReportsHandler,
  createScheduledReportHandler,
  updateScheduledReportHandler,
  deleteScheduledReportHandler,
  runScheduledReportHandler,
  processScheduledReport,
  computeNextRun,
};
