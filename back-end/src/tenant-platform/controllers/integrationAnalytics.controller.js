const db = require("../../db/models");
const paystackService = require("../services/paystack.service");

const getPaystackTransactionsHandler = async (req, res) => {
  try {
    const client = await paystackService.buildPlatformClient();
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
    const client = await paystackService.buildPlatformClient();
    const response = await client.get("/settlement", {
      params: { perPage: 20, page: 1 },
    });
    res.status(200).json({ success: true, collection: response.data.data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch settlements" });
  }
};

const getPaystackDisputesHandler = async (req, res) => {
  try {
    const client = await paystackService.buildPlatformClient();
    const response = await client.get("/dispute", {
      params: { perPage: 20, page: 1 },
    });
    res.status(200).json({ success: true, collection: response.data.data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch disputes" });
  }
};

const getPaystackFeeAnalysisHandler = async (req, res) => {
  try {
    const client = await paystackService.buildPlatformClient();
    const response = await client.get("/transaction", {
      params: { perPage: 100, page: 1 },
    });

    const transactions = response.data.data || [];
    const fees = transactions.map((tx) => ({
      id: tx.id,
      amount: parseFloat(tx.amount || 0),
      fee: parseFloat(tx.fee || 0),
      net: parseFloat(tx.amount || 0) - parseFloat(tx.fee || 0),
      currency: tx.currency,
      status: tx.status,
      createdAt: tx.created_at,
    }));

    const totalAmount = fees.reduce((s, f) => s + f.amount, 0);
    const totalFees = fees.reduce((s, f) => s + f.fee, 0);
    const feeRatio = totalAmount > 0 ? totalFees / totalAmount : 0;

    res.status(200).json({
      success: true,
      summary: {
        totalTransactions: fees.length,
        totalAmount,
        totalFees,
        feeRatio: Math.round(feeRatio * 10000) / 100,
      },
      collection: fees,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch fee analysis" });
  }
};

const getWebhookRetryHandler = async (req, res) => {
  const failedWebhooks = await db.platformAuditLog.findAll({
    where: {
      action: { [db.Sequelize.Op.like]: "webhook%" },
      [db.Sequelize.Op.or]: [
        { metadata: { [db.Sequelize.Op.like]: "%failed%" } },
        { metadata: { [db.Sequelize.Op.like]: "%error%" } },
      ],
    },
    order: [["createdAt", "DESC"]],
    limit: 50,
  });
  res.status(200).json({ success: true, collection: failedWebhooks });
};

const getWhatsAppAnalyticsHandler = async (req, res) => {
  const campaigns = await db.marketingCampaign.findAll({
    where: { type: "whatsapp" },
    attributes: [
      "id",
      "name",
      "status",
      "targetAudience",
      "sentAt",
      [db.sequelize.fn("COUNT", db.sequelize.col("id")), "totalSent"],
    ],
    group: ["id", "name", "status", "targetAudience", "sentAt"],
    order: [["sentAt", "DESC"]],
    limit: 50,
    raw: true,
  });

  const totalSent = campaigns.reduce((s, c) => s + parseInt(c.totalSent || 0, 10), 0);
  const delivered = campaigns.filter((c) => c.status === "sent").length;

  res.status(200).json({
    success: true,
    summary: {
      totalCampaigns: campaigns.length,
      totalSent,
      delivered,
    },
    collection: campaigns,
  });
};

const getWhatsAppCampaignAnalyticsHandler = async (req, res) => {
  const campaigns = await db.marketingCampaign.findAll({
    where: { type: "whatsapp", status: "sent" },
    attributes: [
      "id",
      "name",
      "sentAt",
      "targetAudience",
    ],
    include: [
      {
        model: db.tenant,
        as: "tenant",
        attributes: ["id", "name"],
      },
    ],
    order: [["sentAt", "DESC"]],
    limit: 50,
  });

  res.status(200).json({ success: true, collection: campaigns });
};

const getShaqExpressAnalyticsHandler = async (req, res) => {
  const deliveries = await db.delivery.findAll({
    attributes: [
      "tenantId",
      "status",
      "deliveryAttempts",
      [db.sequelize.fn("COUNT", db.sequelize.col("id")), "totalDeliveries"],
      [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN status = 'delivered' THEN 1 ELSE 0 END")), "delivered"],
      [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN status = 'failed' THEN 1 ELSE 0 END")), "failed"],
      [db.sequelize.fn("AVG", db.sequelize.literal("deliveryAttempts")), "avgAttempts"],
    ],
    group: ["tenantId", "status"],
    order: [["tenantId", "ASC"]],
    raw: true,
  });

  const tenantMap = new Map();
  for (const row of deliveries) {
    const tid = row.tenantId;
    if (!tenantMap.has(tid)) {
      tenantMap.set(tid, {
        tenantId: tid,
        totalDeliveries: 0,
        delivered: 0,
        failed: 0,
        avgAttempts: 0,
      });
    }
    const entry = tenantMap.get(tid);
    entry.totalDeliveries += parseInt(row.totalDeliveries || 0, 10);
    entry.delivered += parseInt(row.delivered || 0, 10);
    entry.failed += parseInt(row.failed || 0, 10);
    entry.avgAttempts = parseFloat(row.avgAttempts || 0);
  }

  res.status(200).json({ success: true, collection: Array.from(tenantMap.values()) });
};

const getUnifiedIntegrationEventLogHandler = async (req, res) => {
  const paystackEvents = await db.paystackEvent.findAll({
    attributes: [
      "id",
      "tenantId",
      "event",
      "createdAt",
      [db.sequelize.literal("'paystack'"), "source"],
    ],
    order: [["createdAt", "DESC"]],
    limit: 50,
  });

  const platformEvents = await db.platformAuditLog.findAll({
    where: {
      action: { [db.Sequelize.Op.like]: "webhook%" },
    },
    attributes: [
      "id",
      "tenantId",
      "action",
      "createdAt",
      [db.sequelize.literal("'webhook'"), "source"],
    ],
    order: [["createdAt", "DESC"]],
    limit: 50,
  });

  const combined = [
    ...paystackEvents.map((e) => ({
      id: e.id,
      tenantId: e.tenantId,
      event: e.event,
      source: "paystack",
      createdAt: e.createdAt,
    })),
    ...platformEvents.map((e) => ({
      id: e.id,
      tenantId: e.tenantId,
      event: e.action,
      source: "webhook",
      createdAt: e.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.status(200).json({ success: true, collection: combined.slice(0, 50) });
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
  getPaystackDisputesHandler,
  getPaystackFeeAnalysisHandler,
  getWebhookStatusHandler,
  getWebhookRetryHandler,
  getThirdPartyStatusHandler,
  getWhatsAppAnalyticsHandler,
  getWhatsAppCampaignAnalyticsHandler,
  getShaqExpressAnalyticsHandler,
  getUnifiedIntegrationEventLogHandler,
};
