const apiKeyDAO = require("../DAOs/apiKey.dao");

const listApiKeysHandler = async (req, res) => {
  const tenantId = parseInt(req.params.tenantId, 10);
  const keys = await apiKeyDAO.list(tenantId);
  res.status(200).json({ success: true, collection: keys.map((k) => ({ ...k.toJSON(), keyHash: undefined })) });
};

const createApiKeyHandler = async (req, res) => {
  const tenantId = parseInt(req.params.tenantId, 10);
  const { name, scopes, expiresInDays } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: "name is required" });
  }
  const record = await apiKeyDAO.create(tenantId, name, scopes || [], expiresInDays);
  res.status(201).json({ success: true, item: { ...record, keyHash: undefined, rawKey: record.rawKey } });
};

const revokeApiKeyHandler = async (req, res) => {
  const tenantId = parseInt(req.params.tenantId, 10);
  const keyId = parseInt(req.params.id, 10);
  const key = await apiKeyDAO.revoke(keyId, tenantId);
  if (!key) {
    return res.status(404).json({ success: false, message: "API key not found" });
  }
  res.status(200).json({ success: true, message: "API key revoked" });
};

module.exports = {
  listApiKeysHandler,
  createApiKeyHandler,
  revokeApiKeyHandler,
};
