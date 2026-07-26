const db = require("../../db/models");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const listSubProcessorsHandler = async (req, res) => {
  const processors = await db.subProcessor.findAll({
    order: [["name", "ASC"]],
  });
  res.status(200).json({ success: true, collection: processors });
};

const createSubProcessorHandler = async (req, res) => {
  const { name, purpose, dataTypes, location, status, dpaUrl, privacyPolicyUrl } = req.body;
  if (!name || !purpose) {
    return res.status(400).json({ success: false, message: "name and purpose are required" });
  }

  const processor = await db.subProcessor.create({
    name,
    purpose,
    dataTypes: dataTypes || [],
    location: location || null,
    status: status || "active",
    dpaUrl: dpaUrl || null,
    privacyPolicyUrl: privacyPolicyUrl || null,
  });

  await platformAuditDAO.log(
    req.user.id,
    "subprocessor.created",
    "sub_processor",
    processor.id,
    null,
    { name, purpose, status: processor.status },
    req.ip
  );

  res.status(201).json({ success: true, item: processor });
};

const updateSubProcessorHandler = async (req, res) => {
  const processor = await db.subProcessor.findByPk(req.params.id);
  if (!processor) {
    return res.status(404).json({ success: false, message: "Sub-processor not found" });
  }

  const allowed = ["name", "purpose", "dataTypes", "location", "status", "dpaUrl", "privacyPolicyUrl"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }

  await processor.update(updates);

  await platformAuditDAO.log(
    req.user.id,
    "subprocessor.updated",
    "sub_processor",
    processor.id,
    null,
    { updates },
    req.ip
  );

  res.status(200).json({ success: true, item: processor });
};

const deleteSubProcessorHandler = async (req, res) => {
  const processor = await db.subProcessor.findByPk(req.params.id);
  if (!processor) {
    return res.status(404).json({ success: false, message: "Sub-processor not found" });
  }

  await processor.destroy();

  await platformAuditDAO.log(
    req.user.id,
    "subprocessor.deleted",
    "sub_processor",
    processor.id,
    null,
    { name: processor.name },
    req.ip
  );

  res.status(200).json({ success: true });
};

module.exports = {
  listSubProcessorsHandler,
  createSubProcessorHandler,
  updateSubProcessorHandler,
  deleteSubProcessorHandler,
};
