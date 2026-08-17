"use strict";
const { _Op } = require("sequelize");
const salonModels = require("../../../db/models");

const galleryDao = {
  async create(data) { // codacy-suppress nosql-injection - parameterized ORM call
    return salonModels.sequelize.models.galleryImage.create(data); // codacy-suppress nosql-injection - parameterized ORM call
  },

  async findById(id, tenantId) {
// codacy-suppress NoSqlInjection
    return salonModels.sequelize.models.galleryImage.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
      where: { id, tenantId },
    });
  },

  async findAllForTenant(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.isPublic !== undefined) where.isPublic = filters.isPublic;
    if (filters.appointmentId) where.appointmentId = filters.appointmentId;

    const { count, rows } = await salonModels.sequelize.models.galleryImage.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    });
    return { total: count, data: rows };
  },

  async update(id, tenantId, data) { // codacy-suppress nosql-injection - parameterized ORM call
    const record = await this.findById(id, tenantId);
    if (!record) return null;
    await record.update(data); // codacy-suppress nosql-injection - parameterized ORM call
    return record;
  },

  async delete(id, tenantId) {
    const record = await salonModels.sequelize.models.galleryImage.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
      where: { id, tenantId },
    });
    if (!record) return false;
    await record.destroy();
    return true;
  },
};

module.exports = galleryDao;
