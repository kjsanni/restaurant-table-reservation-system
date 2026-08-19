const response = require("../utils/response");

const tenantEncryptionKeyDAO = require("../DAOs/tenantEncryptionKey.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const auditLog = require("../utils/auditLog");

const listTenantEncryptionKeysHandler = async (req, res) => {
  const tenantId = req.tenant?.id || req.user?.tenantId;
  if (!tenantId) {
    return response.badRequest(res, "Tenant context is required");
  }
  const { status, purpose, limit } = req.query;
  const data = await tenantEncryptionKeyDAO.findByTenantId(tenantId, {
    status,
    purpose,
    limit: limit ? parseInt(limit, 10) : 100,
  });
  res.status(200).json({ success: true, collection: data });
};

const createTenantEncryptionKeyHandler = async (req, res) => {
  const tenantId = req.tenant?.id || req.user?.tenantId;
  if (!tenantId) {
    return response.badRequest(res, "Tenant context is required");
  }

  const allowed = ["name", "purpose", "algorithm", "metadata"];
  const data = { tenantId };
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      data[key] = req.body[key];
    }
  }
  if (!data.name) {
    return response.badRequest(res, "name is required");
  }

  const key = await tenantEncryptionKeyDAO.create(data);
  await auditLog(req, "tenant_encryption_key.created", "tenant_encryption_key", key.id, { name: key.name, purpose: key.purpose, tenantId });
  res.status(201).json({ success: true, item: key });
};

const rotateTenantEncryptionKeyHandler = async (req, res) => {
  const tenantId = req.tenant?.id || req.user?.tenantId;
  const key = await tenantEncryptionKeyDAO.findById(req.params.id);
  if (!key || key.tenantId !== tenantId) {
    return response.notFound(res, "Encryption key not found");
  }

  const updated = await tenantEncryptionKeyDAO.update(key.id, {
    status: "rotating",
    lastRotatedAt: new Date(),
    rotatedBy: req.user.id,
  });

  await auditLog(req, "tenant_encryption_key.rotated", "tenant_encryption_key", key.id, { name: key.name, tenantId });
  res.status(200).json({ success: true, item: updated });
};

const retireTenantEncryptionKeyHandler = async (req, res) => {
  const tenantId = req.tenant?.id || req.user?.tenantId;
  const key = await tenantEncryptionKeyDAO.findById(req.params.id);
  if (!key || key.tenantId !== tenantId) {
    return response.notFound(res, "Encryption key not found");
  }

  const updated = await tenantEncryptionKeyDAO.update(key.id, {
    status: "retired",
  });

  await auditLog(req, "tenant_encryption_key.retired", "tenant_encryption_key", key.id, { name: key.name, tenantId });
  res.status(200).json({ success: true, item: updated });
};

const deleteTenantEncryptionKeyHandler = async (req, res) => {
  const tenantId = req.tenant?.id || req.user?.tenantId;
  const key = await tenantEncryptionKeyDAO.findById(req.params.id);
  if (!key || key.tenantId !== tenantId) {
    return response.notFound(res, "Encryption key not found");
  }
  await tenantEncryptionKeyDAO.remove(req.params.id);
  await auditLog(req, "tenant_encryption_key.deleted", "tenant_encryption_key", key.id, { name: key.name, tenantId });
  res.status(200).json({ success: true });
};

module.exports = {
  listTenantEncryptionKeysHandler,
  createTenantEncryptionKeyHandler,
  rotateTenantEncryptionKeyHandler,
  retireTenantEncryptionKeyHandler,
  deleteTenantEncryptionKeyHandler,
};
