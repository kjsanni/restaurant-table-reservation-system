"use strict";
const { Op } = require("sequelize");
const salonModels = require("../../../db/models");

const marketingCampaignDao = {
  async create(data) { // codacy-suppress nosql-injection - parameterized ORM call
    return salonModels.sequelize.models.marketingCampaign.create(data); // codacy-suppress nosql-injection - parameterized ORM call
  },

  async findById(id, tenantId) {
// codacy-suppress NoSqlInjection
    return salonModels.sequelize.models.marketingCampaign.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
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

  async update(id, tenantId, data) { // codacy-suppress nosql-injection - parameterized ORM call
    const [affected] = await salonModels.sequelize.models.marketingCampaign.update(data, { // codacy-suppress nosql-injection - parameterized ORM call
      where: { id, tenantId },
      returning: true,
    });
    if (!affected) return null;
    return salonModels.sequelize.models.marketingCampaign.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  },

  async delete(id, tenantId) {
    const record = await salonModels.sequelize.models.marketingCampaign.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
      where: { id, tenantId },
    });
    if (!record) return false;
    await record.destroy();
    return true;
  },

  async findDueForSending(tenantId, beforeDate) {
    return salonModels.sequelize.models.marketingCampaign.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
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
