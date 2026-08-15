const response = require("../utils/response");

const subProcessorDAO = require("../DAOs/subProcessor.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const auditLog = require("../utils/auditLog");

const listSubProcessorsHandler = async (req, res) => {
  const { category, isActive } = req.query;
  const data = await subProcessorDAO.list({
    category: category || undefined,
    isActive: isActive !== undefined ? isActive === "true" : undefined,
  });
  res.status(200).json({ success: true, collection: data });
};

const createSubProcessorHandler = async (req, res) => {
  const { name, category, country, dataTypes, purpose, isActive } = req.body;
  if (!name) {
    return response.badRequest(res, "name is required");
  }

  const processor = await subProcessorDAO.create({
    name,
    category: category || null,
    country: country || null,
    dataTypes: dataTypes || null,
    purpose: purpose || null,
    isActive: isActive ?? true,
  });

await auditLog(req, "platform.sub_processor_created", "sub_processor", processor.id, { name, category });

  res.status(201).json({ success: true, item: processor });
};

const updateSubProcessorHandler = async (req, res) => {
  const { name, category, country, dataTypes, purpose, isActive } = req.body;
  const processor = await subProcessorDAO.update(req.params.id, {
    name: name ?? undefined,
    category: category ?? undefined,
    country: country ?? undefined,
    dataTypes: dataTypes ?? undefined,
    purpose: purpose ?? undefined,
    isActive: isActive ?? undefined,
  });

  if (!processor) {
    return response.notFound(res, "Sub-processor not found");
  }

  await auditLog(req, "platform.sub_processor_updated", "sub_processor", processor.id, { name: processor.name });

  res.status(200).json({ success: true, item: processor });
};

const deleteSubProcessorHandler = async (req, res) => {
  const processor = await subProcessorDAO.remove(req.params.id);
  if (!processor) {
    return response.notFound(res, "Sub-processor not found");
  }

  await auditLog(req, "platform.sub_processor_deleted", "sub_processor", processor.id, { name: processor.name });

  res.status(200).json({ success: true });
};

module.exports = {
  listSubProcessorsHandler,
  createSubProcessorHandler,
  updateSubProcessorHandler,
  deleteSubProcessorHandler,
};
