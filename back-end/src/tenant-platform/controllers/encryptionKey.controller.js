const response = require("../utils/response");

const encryptionKeyDAO = require("../DAOs/encryptionKey.dao");
const auditLog = require("../utils/auditLog");

const listEncryptionKeysHandler = async (req, res) => {
  const { status: queryStatus, purpose, limit } = req.query;
  const data = await encryptionKeyDAO.list({
    queryStatus,
    purpose,
    limit: limit ? parseInt(limit, 10) : 100,
  });
  res.status(200).json({ success: true, collection: data });
};

const getEncryptionKeyHandler = async (req, res) => {
  const key = await encryptionKeyDAO.findById(req.params.id);
  if (!key) {
    return response.notFound(res, "Encryption key not found");
  }
  res.status(200).json({ success: true, item: key });
};

const createEncryptionKeyHandler = async (req, res) => {
  const allowed = ["name", "purpose", "algorithm", "metadata"];
  const data = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      data[key] = req.body[key];
    }
  }
  if (!data.name) {
    return response.badRequest(res, "name is required");
  }
  const key = await encryptionKeyDAO.create(data);
await auditLog(req, "encryption_key.created", "encryption_key", key.id, { name: key.name, purpose: key.purpose });
  res.status(201).json({ success: true, item: key });
};

const rotateEncryptionKeyHandler = async (req, res) => {
  const key = await encryptionKeyDAO.findById(req.params.id);
  if (!key) {
    return response.notFound(res, "Encryption key not found");
  }

  const updated = await encryptionKeyDAO.update(key.id, {
    status: "rotating",
    lastRotatedAt: new Date(),
    rotatedBy: req.user.id,
  });

  await auditLog(req, "encryption_key.rotated", "encryption_key", key.id, { name: key.name });

  res.status(200).json({ success: true, item: updated });
};

const retireEncryptionKeyHandler = async (req, res) => {
  const key = await encryptionKeyDAO.findById(req.params.id);
  if (!key) {
    return response.notFound(res, "Encryption key not found");
  }

  const updated = await encryptionKeyDAO.update(key.id, {
    status: "retired",
  });

  await auditLog(req, "encryption_key.retired", "encryption_key", key.id, { name: key.name });

  res.status(200).json({ success: true, item: updated });
};

const deleteEncryptionKeyHandler = async (req, res) => {
  const key = await encryptionKeyDAO.remove(req.params.id);
  if (!key) {
    return response.notFound(res, "Encryption key not found");
  }
  await auditLog(req, "encryption_key.deleted", "encryption_key", key.id, { name: key.name });
  res.status(200).json({ success: true });
};

module.exports = {
  listEncryptionKeysHandler,
  getEncryptionKeyHandler,
  createEncryptionKeyHandler,
  rotateEncryptionKeyHandler,
  retireEncryptionKeyHandler,
  deleteEncryptionKeyHandler,
};
