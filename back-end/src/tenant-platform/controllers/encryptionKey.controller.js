const encryptionKeyDAO = require("../DAOs/encryptionKey.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const listEncryptionKeysHandler = async (req, res) => {
  const { status, purpose, limit } = req.query;
  const data = await encryptionKeyDAO.list({
    status,
    purpose,
    limit: limit ? parseInt(limit, 10) : 100,
  });
  res.status(200).json({ success: true, collection: data });
};

const getEncryptionKeyHandler = async (req, res) => {
  const key = await encryptionKeyDAO.findById(req.params.id);
  if (!key) {
    return res.status(404).json({ success: false, message: "Encryption key not found" });
  }
  res.status(200).json({ success: true, item: key });
};

const createEncryptionKeyHandler = async (req, res) => {
  const key = await encryptionKeyDAO.create(req.body);
  await platformAuditDAO.log(
    req.user.id,
    "encryption_key.created",
    "encryption_key",
    key.id,
    null,
    { name: key.name, purpose: key.purpose },
    req.ip
  );
  res.status(201).json({ success: true, item: key });
};

const rotateEncryptionKeyHandler = async (req, res) => {
  const key = await encryptionKeyDAO.findById(req.params.id);
  if (!key) {
    return res.status(404).json({ success: false, message: "Encryption key not found" });
  }

  const updated = await encryptionKeyDAO.update(key.id, {
    status: "rotating",
    lastRotatedAt: new Date(),
    rotatedBy: req.user.id,
  });

  await platformAuditDAO.log(
    req.user.id,
    "encryption_key.rotated",
    "encryption_key",
    key.id,
    null,
    { name: key.name },
    req.ip
  );

  res.status(200).json({ success: true, item: updated });
};

const retireEncryptionKeyHandler = async (req, res) => {
  const key = await encryptionKeyDAO.findById(req.params.id);
  if (!key) {
    return res.status(404).json({ success: false, message: "Encryption key not found" });
  }

  const updated = await encryptionKeyDAO.update(key.id, {
    status: "retired",
  });

  await platformAuditDAO.log(
    req.user.id,
    "encryption_key.retired",
    "encryption_key",
    key.id,
    null,
    { name: key.name },
    req.ip
  );

  res.status(200).json({ success: true, item: updated });
};

const deleteEncryptionKeyHandler = async (req, res) => {
  const key = await encryptionKeyDAO.remove(req.params.id);
  if (!key) {
    return res.status(404).json({ success: false, message: "Encryption key not found" });
  }
  await platformAuditDAO.log(
    req.user.id,
    "encryption_key.deleted",
    "encryption_key",
    key.id,
    null,
    { name: key.name },
    req.ip
  );
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
