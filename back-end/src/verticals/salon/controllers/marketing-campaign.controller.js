"use strict";
const marketingCampaignDao = require("../DAOs/marketingCampaign.dao");

const createMarketingCampaignHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const payload = req.body;

    const campaign = await marketingCampaignDao.create({
      tenantId,
      name: payload.name,
      type: payload.type,
      subject: payload.subject || null,
      content: payload.content || null,
      targetAudience: payload.targetAudience || "all",
      status: payload.status || "draft",
      scheduledAt: payload.scheduledAt || null,
      createdBy: req.user?.id || null,
    });

    return res.status(201).json({ success: true, campaign });
  } catch (err) {
    console.error("createMarketingCampaignHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to create campaign" });
  }
};

const getMarketingCampaignsHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const result = await marketingCampaignDao.findAllForTenant(tenantId, req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("getMarketingCampaignsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load campaigns" });
  }
};

const updateMarketingCampaignHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const updated = await marketingCampaignDao.update(id, tenantId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }
    return res.status(200).json({ success: true, campaign: updated });
  } catch (err) {
    console.error("updateMarketingCampaignHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update campaign" });
  }
};

const deleteMarketingCampaignHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const removed = await marketingCampaignDao.delete(id, tenantId);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("deleteMarketingCampaignHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete campaign" });
  }
};

const sendMarketingCampaignHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const campaign = await marketingCampaignDao.findById(id, tenantId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    const salonModels = require("../../../db/models");
    const notificationService = require("../../../services/notification.service");

    let recipients = [];
    if (campaign.recipients && Array.isArray(campaign.recipients)) {
      recipients = campaign.recipients;
    } else {
      const customers = await salonModels.sequelize.models.customer.findAll({
        where: { tenantId },
        attributes: ["phone", "email"],
      });
      recipients = customers
        .filter((c) => c.phone || c.email)
        .map((c) => ({ phone: c.phone, email: c.email }));
    }

    const results = [];
    for (const recipient of recipients) {
      const result = await notificationService.sendViaChannels(
        { customerPhone: recipient.phone, customerEmail: recipient.email },
        { message: campaign.content },
        ["whatsapp", "email"],
        tenantId
      );
      results.push({ recipient, result });
    }

    const successCount = results.filter((r) => r.result.some((c) => c.sent)).length;

    await marketingCampaignDao.update(id, tenantId, {
      status: "sent",
      sentAt: new Date(),
      recipients,
    });

    return res.status(200).json({ success: true, sentCount: successCount, total: recipients.length });
  } catch (err) {
    console.error("sendMarketingCampaignHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to send campaign" });
  }
};

module.exports = {
  createMarketingCampaignHandler,
  getMarketingCampaignsHandler,
  updateMarketingCampaignHandler,
  deleteMarketingCampaignHandler,
  sendMarketingCampaignHandler,
};
