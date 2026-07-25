"use strict";
const { Op } = require("sequelize");
const salonModels = require("../../../db/models");

const galleryDao = {
  async create(data) {
    return salonModels.sequelize.models.galleryImage.create(data);
  },

  async findById(id, tenantId) {
    return salonModels.sequelize.models.galleryImage.findOne({
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

  async delete(id, tenantId) {
    const record = await salonModels.sequelize.models.galleryImage.findOne({
      where: { id, tenantId },
    });
    if (!record) return false;
    await record.destroy();
    return true;
  },
};

module.exports = galleryDao;
