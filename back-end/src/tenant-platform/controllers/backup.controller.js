const backupRecordDAO = require("../DAOs/backupRecord.dao");
const backupService = require("../services/backup.service");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const fs = require("fs");

const listBackupRecordsHandler = async (req, res) => {
  const { status, type, limit } = req.query;
  const data = await backupRecordDAO.list({
    status,
    type,
    limit: limit ? parseInt(limit, 10) : 50,
  });
  res.status(200).json({ success: true, collection: data });
};

const getBackupRecordHandler = async (req, res) => {
  const record = await backupRecordDAO.findById(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: "Backup record not found" });
  }
  res.status(200).json({ success: true, item: record });
};

const createBackupHandler = async (req, res) => {
  const record = await backupRecordDAO.create({
    type: req.body.type || "full",
    status: "pending",
    metadata: req.body.metadata || {},
  });
  res.status(201).json({ success: true, item: record });
};

const updateBackupHandler = async (req, res) => {
  const allowed = ["status", "sizeBytes", "storagePath", "error", "startedAt", "completedAt"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }
  const record = await backupRecordDAO.update(req.params.id, updates);
  if (!record) {
    return res.status(404).json({ success: false, message: "Backup record not found" });
  }
  res.status(200).json({ success: true, item: record });
};

const getBackupStatusHandler = async (req, res) => {
  const latest = await backupRecordDAO.getLatest("completed");
  res.status(200).json({
    success: true,
    latestBackup: latest || null,
    lastBackupAt: latest?.createdAt || null,
  });
};

const executeBackupHandler = async (req, res) => {
  const record = await backupRecordDAO.findById(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: "Backup record not found" });
  }

  await backupRecordDAO.update(record.id, { status: "running", startedAt: new Date() });

  try {
    const result = await backupService.runBackup({ type: record.type });
    await backupRecordDAO.update(record.id, {
      status: "completed",
      sizeBytes: result.sizeBytes,
      storagePath: result.path,
      completedAt: new Date(),
    });

    await platformAuditDAO.log(
      req.user.id,
      "backup.completed",
      "backup",
      record.id,
      null,
      { type: record.type, sizeBytes: result.sizeBytes },
      req.ip
    );

    res.status(200).json({ success: true, item: await backupRecordDAO.findById(record.id) });
  } catch (err) {
    await backupRecordDAO.update(record.id, {
      status: "failed",
      error: err.message || "Backup failed",
      completedAt: new Date(),
    });

    await platformAuditDAO.log(
      req.user.id,
      "backup.failed",
      "backup",
      record.id,
      null,
      { error: err.message || "Backup failed" },
      req.ip
    );

    res.status(500).json({ success: false, message: err.message || "Backup failed" });
  }
};

const restoreBackupHandler = async (req, res) => {
  const record = await backupRecordDAO.findById(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: "Backup record not found" });
  }

  if (!record.storagePath) {
    return res.status(400).json({ success: false, message: "Backup file not available for restore" });
  }

  const dryRun = req.body.dryRun === true;

  try {
    if (dryRun) {
      const result = await backupService.runRestore({ filePath: record.storagePath, dryRun: true });
      res.status(200).json({ success: true, dryRun: true, ...result });
    } else {
      const result = await backupService.runRestore({ filePath: record.storagePath });
      await platformAuditDAO.log(
        req.user.id,
        "backup.restored",
        "backup",
        record.id,
        null,
        { type: record.type },
        req.ip
      );
      res.status(200).json({ success: true, ...result });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Restore failed" });
  }
};

const downloadBackupHandler = async (req, res) => {
  const record = await backupRecordDAO.findById(req.params.id);
  if (!record || !record.storagePath) {
    return res.status(404).json({ success: false, message: "Backup file not found" });
  }

  if (!fs.existsSync(record.storagePath)) {
    return res.status(404).json({ success: false, message: "Backup file missing from storage" });
  }

  res.download(record.storagePath, record.fileName || path.basename(record.storagePath));
};

const scheduleBackupHandler = async (req, res) => {
  const record = await backupRecordDAO.findById(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: "Backup record not found" });
  }

  const { frequency, nextRunAt } = req.body;
  const allowed = ["frequency", "nextRunAt", "lastRunAt"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }

  const updated = await backupRecordDAO.updateScheduling(record.id, updates);
  res.status(200).json({ success: true, item: updated });
};

const getScheduledBackupsHandler = async (req, res) => {
  const records = await backupRecordDAO.findScheduled();
  res.status(200).json({ success: true, collection: records });
};

module.exports = {
  listBackupRecordsHandler,
  getBackupRecordHandler,
  createBackupHandler,
  updateBackupHandler,
  getBackupStatusHandler,
  executeBackupHandler,
  restoreBackupHandler,
  downloadBackupHandler,
  scheduleBackupHandler,
  getScheduledBackupsHandler,
};
