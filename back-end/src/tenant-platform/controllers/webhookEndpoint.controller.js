const webhookEndpointDAO = require("../DAOs/webhookEndpoint.dao");

const listWebhookEndpointsHandler = async (req, res) => {
  const endpoints = await webhookEndpointDAO.findAll({ tenantId: req.tenant?.id });
  return res.status(200).json({ success: true, collection: endpoints });
};

const createWebhookEndpointHandler = async (req, res) => {
  const { url, events, secret } = req.body;

  if (!url || !events || !Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ success: false, message: "url and events array are required" });
  }

  const endpoint = await webhookEndpointDAO.create({
    tenantId: req.tenant?.id,
    url,
    events,
    secret,
    isActive: true,
  });

  return res.status(201).json({ success: true, item: endpoint });
};

const updateWebhookEndpointHandler = async (req, res) => {
  const endpoint = await webhookEndpointDAO.findById(req.params.id);
  if (!endpoint || endpoint.tenantId !== req.tenant?.id) {
    return res.status(404).json({ success: false, message: "Webhook endpoint not found" });
  }

  const allowed = ["url", "events", "secret", "isActive"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }

  const updated = await webhookEndpointDAO.update(req.params.id, updates);
  return res.status(200).json({ success: true, item: updated });
};

const deleteWebhookEndpointHandler = async (req, res) => {
  const endpoint = await webhookEndpointDAO.findById(req.params.id);
  if (!endpoint || endpoint.tenantId !== req.tenant?.id) {
    return res.status(404).json({ success: false, message: "Webhook endpoint not found" });
  }

  await webhookEndpointDAO.remove(req.params.id);
  return res.status(200).json({ success: true, message: "Webhook endpoint deleted" });
};

module.exports = {
  listWebhookEndpointsHandler,
  createWebhookEndpointHandler,
  updateWebhookEndpointHandler,
  deleteWebhookEndpointHandler,
};
