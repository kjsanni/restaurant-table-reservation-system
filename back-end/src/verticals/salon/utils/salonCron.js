"use strict";

const salonModels = require("../../../db/models");
const appointmentDao = require("../DAOs/appointment.dao");
const recurringAppointmentDao = require("../DAOs/recurringAppointment.dao");
const marketingCampaignDao = require("../DAOs/marketingCampaign.dao");
const { sendSalonConfirmation } = require("../../../services/notification.service");
const notificationService = require("../../../services/notification.service");

const addInterval = (date, frequency, interval) => {
  const d = new Date(date);
  const n = interval || 1;
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + n);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7 * n);
      break;
    case "biweekly":
      d.setDate(d.getDate() + 14 * n);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + n);
      break;
    default:
      d.setDate(d.getDate() + n);
  }
  return d;
};

const formatDateOnly = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const processRecurringAppointments = async (tenantId) => {
  const today = formatDateOnly(new Date());
  const recurring = await recurringAppointmentDao.findActiveForDateRange(tenantId, today, today);

  const results = [];
  for (const r of recurring) {
    try {
      let nextDate = r.lastGeneratedAt ? new Date(r.lastGeneratedAt) : new Date(r.startDate);
      if (r.lastGeneratedAt) {
        nextDate = addInterval(nextDate, r.frequency, r.interval);
      }
      let nextDateStr = formatDateOnly(nextDate);

      while (nextDateStr < today) {
        nextDate = addInterval(nextDate, r.frequency, r.interval);
        nextDateStr = formatDateOnly(nextDate);
      }

      if (nextDateStr > today) continue;
      if (r.endDate && nextDateStr > r.endDate) continue;

      const existing = await appointmentDao.findExistingInstance(tenantId, r.customerId, r.serviceId, nextDateStr);
      if (existing) {
        await recurringAppointmentDao.update(r.id, tenantId, {
          lastGeneratedAt: nextDateStr,
        });
        continue;
      }

      const [hours, minutes] = (r.timeOfDay || "00:00").split(":").map(Number);
      const start = new Date(nextDate);
      start.setHours(hours || 0, minutes || 0, 0, 0);
      const end = new Date(start.getTime() + (r.durationMinutes || 30) * 60000);

      const appointment = await appointmentDao.create({
        tenantId,
        customerId: r.customerId,
        serviceId: r.serviceId,
        stylistId: r.stylistId,
        stationId: r.stationId,
        start: start.toISOString(),
        end: end.toISOString(),
        durationMinutes: r.durationMinutes || 30,
        status: "confirmed",
        paymentStatus: "unpaid",
        depositAmount: 0,
        source: "web",
      });
      console.log("DEBUG cron created", { appointmentId: appointment?.id, recurringId: r.id });

      await recurringAppointmentDao.update(r.id, tenantId, {
        lastGeneratedAt: nextDateStr,
      });

      if (appointment?.id) {
        sendSalonConfirmation(appointment, tenantId).catch(() => {});
        results.push({ recurringId: r.id, appointmentId: appointment.id, date: nextDateStr });
      }
    } catch (err) {
      console.error("Failed to process recurring appointment:", err.message);
    }
  }

  return results;
};

const processMarketingCampaigns = async (tenantId) => {
  const now = new Date();
  const campaigns = await marketingCampaignDao.findDueForSending(tenantId, now);
  const results = [];

  for (const campaign of campaigns) {
    try {
      const resolved = await resolveRecipients(tenantId, campaign.targetAudience);

      for (const recipient of resolved) {
        await notificationService.sendViaChannels(
          { customerPhone: recipient.phone, customerEmail: recipient.email },
          { message: campaign.content },
          ["whatsapp", "email"],
          tenantId
        );
      }

      await marketingCampaignDao.update(campaign.id, tenantId, {
        status: "sent",
        sentAt: now,
        recipients: resolved,
      });

      results.push({ campaignId: campaign.id, status: "sent", count: resolved.length });
    } catch (err) {
      console.error("Failed to send marketing campaign:", err.message);
      results.push({ campaignId: campaign.id, status: "failed", error: err.message });
    }
  }

  return results;
};

const resolveRecipients = async (tenantId, targetAudience) => {
  const { Op } = require("sequelize");
  const customerModel = salonModels.sequelize.models.customer;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const baseWhere = { tenantId };

  let segmentWhere = {};
  switch (targetAudience) {
    case "vip":
      segmentWhere = {
        [Op.or]: [
          { points: { [Op.gte]: 100 } },
          { tags: { [Op.contains]: ["vip"] } },
        ],
      };
      break;
    case "new":
      segmentWhere = {
        visitCount: { [Op.lte]: 2 },
      };
      break;
    case "inactive":
      segmentWhere = {
        [Op.or]: [
          { lastVisitDate: { [Op.lt]: thirtyDaysAgo } },
          { lastVisitDate: null },
        ],
      };
      break;
    case "all":
    default:
      segmentWhere = {};
      break;
  }

  const customers = await customerModel.findAll({
    where: { ...baseWhere, ...segmentWhere },
    attributes: ["phone", "email"],
  });
  return customers
    .filter((c) => c.phone || c.email)
    .map((c) => ({ phone: c.phone, email: c.email }));
};

const runSalonCron = async () => {
  const tenants = await salonModels.sequelize.models.tenant.findAll({
    where: { businessVertical: "salon", status: "active" },
    attributes: ["id"],
  });

  const results = {};
  for (const tenant of tenants) {
    try {
      const recurring = await processRecurringAppointments(tenant.id);
      const marketing = await processMarketingCampaigns(tenant.id);
      results[tenant.id] = { recurring, marketing };
    } catch (err) {
      console.error(`[SalonCron] Tenant ${tenant.id} error:`, err.message);
      results[tenant.id] = { error: err.message };
    }
  }

  return results;
};

module.exports = {
  runSalonCron,
  processRecurringAppointments,
  processMarketingCampaigns,
};
