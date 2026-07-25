const backupRecordDAO = require("../DAOs/backupRecord.dao");

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

module.exports = {
  listBackupRecordsHandler,
  getBackupRecordHandler,
  createBackupHandler,
  updateBackupHandler,
  getBackupStatusHandler,
};
