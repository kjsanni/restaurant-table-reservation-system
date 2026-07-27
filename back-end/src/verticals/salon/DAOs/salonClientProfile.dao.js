"use strict";
const { Op } = require("sequelize");
const salonModels = require("../models");

const salonClientProfileDao = {
  async findByCustomerId(tenantId, customerId) {
    return salonModels.sequelize.models.salonClientProfile.findOne({
      where: { tenantId, customerId },
      include: [
        { model: salonModels.sequelize.models.customer, as: "customer", attributes: ["id", "firstName", "lastName", "phone", "email"] },
      ],
    });
  },

  async upsert(data) {
    const where = { tenantId: data.tenantId, customerId: data.customerId };
    const [record] = await salonModels.sequelize.models.salonClientProfile.findOrCreate({
      where,
      defaults: data,
    });
    if (!record._previousDataValues || record._previousDataValues.customerId !== data.customerId) {
      return record;
    }
    await salonModels.sequelize.models.salonClientProfile.update(data, { where });
    return salonModels.sequelize.models.salonClientProfile.findOne({ where });
  },

  async getSegmentation(tenantId) {
    const results = await salonModels.sequelize.models.salonClientProfile.findAll({
      where: { tenantId },
      attributes: [
        "tier",
        [salonModels.sequelize.fn("COUNT", salonModels.sequelize.col("salonClientProfile.id")), "count"],
        [salonModels.sequelize.fn("SUM", salonModels.sequelize.col("salonClientProfile.totalSpent")), "totalSpent"],
        [salonModels.sequelize.fn("AVG", salonModels.sequelize.col("salonClientProfile.totalVisits")), "avgVisits"],
      ],
      group: ["tier"],
      order: [["totalSpent", "DESC"]],
    });

    return results.map((row) => ({
      tier: row.get("tier"),
      count: Number(row.get("count") || 0),
      totalSpent: Number(row.get("totalSpent") || 0),
      avgVisits: Number(row.get("avgVisits") || 0),
    }));
  },

  async markNoShow(tenantId, customerId) {
    const profile = await salonModels.sequelize.models.salonClientProfile.findOne({
      where: { tenantId, customerId },
    });
    if (!profile) return null;

    await profile.update({
      noShowCount: profile.noShowCount + 1,
      lastNoShowAt: new Date().toISOString().split("T")[0],
    });

    return profile;
  },

  async recordVisit(tenantId, customerId, amount) {
    const profile = await salonModels.sequelize.models.salonClientProfile.findOne({
      where: { tenantId, customerId },
    });
    if (!profile) return null;

    const newTotalVisits = profile.totalVisits + 1;
    const newTotalSpent = profile.totalSpent + Number(amount || 0);

    let newTier = "bronze";
    if (newTotalSpent >= 2000 || newTotalVisits >= 20) {
      newTier = "platinum";
    } else if (newTotalSpent >= 1000 || newTotalVisits >= 10) {
      newTier = "gold";
    } else if (newTotalSpent >= 500 || newTotalVisits >= 5) {
      newTier = "silver";
    }

    await profile.update({
      totalVisits: newTotalVisits,
      totalSpent: newTotalSpent,
      tier: newTier,
      lastVisitAt: new Date().toISOString().split("T")[0],
    });

    return profile;
  },
};

module.exports = salonClientProfileDao;
