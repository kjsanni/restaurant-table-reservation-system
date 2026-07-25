const db = require("../../db/models");
const paystackService = require("../services/paystack.service");

const getPaystackTransactionsHandler = async (req, res) => {
  try {
    const tenant = await db.tenant.findByPk(req.query.tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: "Tenant not found" });
    }
    const client = await paystackService.createTenantClient(tenant);
    const response = await client.get("/transaction", {
      params: { perPage: 20, page: 1 },
    });
    res.status(200).json({ success: true, collection: response.data.data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
};

const getPaystackSettlementsHandler = async (req, res) => {
  try {
    const tenant = await db.tenant.findByPk(req.query.tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: "Tenant not found" });
    }
    const client = await paystackService.createTenantClient(tenant);
    const response = await client.get("/settlement", {
      params: { perPage: 20, page: 1 },
    });
    res.status(200).json({ success: true, collection: response.data.data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch settlements" });
  }
};

const getWebhookStatusHandler = async (req, res) => {
  const events = await db.platformAuditLog.findAll({
    where: { action: { [db.Sequelize.Op.like]: "webhook%" } },
    order: [["createdAt", "DESC"]],
    limit: 50,
  });
  res.status(200).json({ success: true, collection: events });
};

const getThirdPartyStatusHandler = async (req, res) => {
  const integrations = {
    paystack: { status: "unknown", lastCheck: null },
    whatsapp: { status: "unknown", lastCheck: null },
    shaqexpress: { status: "unknown", lastCheck: null },
    email: { status: "unknown", lastCheck: null },
  };

  try {
    const config = await db.setting.findOne({ where: { key: "paystack_config" } });
    integrations.paystack.status = config?.value?.secretKey ? "configured" : "not_configured";
    integrations.paystack.lastCheck = new Date().toISOString();
  } catch {
    integrations.paystack.status = "error";
  }

  try {
    const waConfig = await db.setting.findOne({ where: { key: "salon_whatsapp_config" } });
    integrations.whatsapp.status = waConfig?.value?.enabled ? "enabled" : "disabled";
    integrations.whatsapp.lastCheck = new Date().toISOString();
  } catch {
    integrations.whatsapp.status = "error";
  }

  try {
    const seConfig = await db.setting.findOne({ where: { key: "shaqexpress_config" } });
    integrations.shaqexpress.status = seConfig?.value?.enabled ? "enabled" : "disabled";
    integrations.shaqexpress.lastCheck = new Date().toISOString();
  } catch {
    integrations.shaqexpress.status = "error";
  }

  try {
    const emailConfig = await db.setting.findOne({ where: { key: "email_server" } });
    integrations.email.status = emailConfig?.value?.host ? "configured" : "not_configured";
    integrations.email.lastCheck = new Date().toISOString();
  } catch {
    integrations.email.status = "error";
  }

  res.status(200).json({ success: true, integrations });
};

module.exports = {
  getPaystackTransactionsHandler,
  getPaystackSettlementsHandler,
  getWebhookStatusHandler,
  getThirdPartyStatusHandler,
};
