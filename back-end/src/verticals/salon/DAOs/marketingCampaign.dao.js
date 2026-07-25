"use strict";
const { Op } = require("sequelize");
const salonModels = require("../../../db/models");

const marketingCampaignDao = {
  async create(data) {
    return salonModels.sequelize.models.marketingCampaign.create(data);
  },

  async findById(id, tenantId) {
    return salonModels.sequelize.models.marketingCampaign.findOne({
      where: { id, tenantId },
    });
  },

  async findAllForTenant(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;

    const { count, rows } = await salonModels.sequelize.models.marketingCampaign.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    });
    return { total: count, data: rows };
  },

  async update(id, tenantId, data) {
    const [affected] = await salonModels.sequelize.models.marketingCampaign.update(data, {
      where: { id, tenantId },
      returning: true,
    });
    if (!affected) return null;
    return salonModels.sequelize.models.marketingCampaign.findByPk(id);
  },

  async delete(id, tenantId) {
    const record = await salonModels.sequelize.models.marketingCampaign.findOne({
      where: { id, tenantId },
    });
    if (!record) return false;
    await record.destroy();
    return true;
  },

  async findDueForSending(tenantId, beforeDate) {
    return salonModels.sequelize.models.marketingCampaign.findAll({
      where: {
        tenantId,
        status: "scheduled",
        scheduledAt: { [Op.lte]: beforeDate },
      },
      order: [["scheduledAt", "ASC"]],
      limit: 50,
    });
  },
};

module.exports = marketingCampaignDao;
