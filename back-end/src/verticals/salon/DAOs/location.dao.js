"use strict";

const db = require("../../../db/models");

const locationDAO = {
  async findAll(tenantId) {
    return db.location.findAll({
      where: { tenantId },
      order: [["isPrimary", "DESC"], ["name", "ASC"]],
    });
  },

  async findAllForTenant(tenantId) {
    return this.findAll(tenantId);
  },

  async findAllWithCoordinates(tenantId) {
    return db.location.findAll({
      where: {
        tenantId,
        latitude: { [db.Sequelize.Op.not]: null },
        longitude: { [db.Sequelize.Op.not]: null },
      },
      order: [["isPrimary", "DESC"], ["name", "ASC"]],
    });
  },

  async findById(id, tenantId) {
// codacy-suppress NoSqlInjection
    return db.location.findOne({
      where: { id, tenantId },
    });
  },

  async create(data, tenantId) {
    return db.location.create({ ...data, tenantId });
  },

  async update(id, tenantId, updates) {
    const location = await db.location.findOne({ where: { id, tenantId } });
    if (!location) return null;
    await location.update(updates);
    return location;
  },

  async delete(id, tenantId) {
    const location = await db.location.findOne({ where: { id, tenantId } });
    if (!location) return false;
    await location.destroy();
    return true;
  },
};

module.exports = locationDAO;
