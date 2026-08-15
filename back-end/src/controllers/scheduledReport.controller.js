"use strict";
const scheduledReportDAO = require("../DAOs/scheduledReport.dao");
const { sendEmail } = require("../services/emailService");
const { exportSalonReportsHandler } = require("../controllers/salon-reports.controller");

const listScheduledReportsHandler = async (req, res) => {
  try {
    const items = await scheduledReportDAO.list({ tenantId: req.tenant?.id });
    return res.status(200).json({ success: true, collection: items });
  } catch (err) {
    console.error("listScheduledReportsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load scheduled reports" });
  }
};

const createScheduledReportHandler = async (req, res) => {
  try {
    const { name, reportType, frequency, recipients, format, filters, frequencyDay, frequencyTime } = req.body;

    if (!name || !reportType || !frequency || !recipients?.length) {
      return res.status(400).json({ success: false, message: "name, reportType, frequency, and recipients are required" });
    }

    const nextRunAt = computeNextRun(frequency, frequencyDay, frequencyTime);

    const report = await scheduledReportDAO.create({
      tenantId: req.tenant?.id,
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

    const updates = buildScheduledReportUpdates(req.body, report);
    const updated = await scheduledReportDAO.update(req.params.id, updates);
    return res.status(200).json({ success: true, item: updated });
  } catch (err) {
    console.error("updateScheduledReportHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update scheduled report" });
  }
};

const buildScheduledReportUpdates = (body, existing) => {
  const updates = {};
  const fields = ["name", "filters", "frequency", "frequencyDay", "frequencyTime", "recipients", "enabled"];

  fields.forEach((field) => {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  });

  if (body.frequency || body.frequencyTime) {
    updates.nextRunAt = computeNextRun(
      body.frequency || existing.frequency,
      body.frequencyDay !== undefined ? body.frequencyDay : existing.frequencyDay,
      body.frequencyTime || existing.frequencyTime
    );
  }

  return updates;
};

const deleteScheduledReportHandler = async (req, res) => {
  try {
    const report = await scheduledReportDAO.remove(req.params.id, req.tenant?.id);
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
    const report = await scheduledReportDAO.findById(req.params.id, req.tenant?.id);
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

const escapeHtml = (value) => {
  const str = String(value ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
  // codacy-suppress Semgrep_javascript.express.security.injection.raw-html-format
  const html = `<p>Please find attached your scheduled report: <strong>${escapeHtml(report.name)}</strong>.</p>`;
  const from = process.env.DEFAULT_FROM_EMAIL || "reports@vibespot.tech";

  await sendReportToRecipients(report, subject, html, from, csv);
  await scheduledReportDAO.update(report.id, {
    lastRunAt: new Date(),
    nextRunAt: computeNextRun(report.frequency, report.frequencyDay, report.frequencyTime),
  });
};

const sendReportToRecipients = async (report, subject, html, _from, _csv) => {
  for (const recipient of report.recipients) {
    await sendEmail({
      to: recipient,
      subject,
      text: `${subject}\n\nReport type: ${report.reportType}\nPeriod: ${report.filters?.from || "N/A"} to ${report.filters?.to || "N/A"}`,
      html,
    });
  }
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
