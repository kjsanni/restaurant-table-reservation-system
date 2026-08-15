"use strict";
const db = require("../../../db/models");

const staffDAO = {
  async findAllForTenant(tenantId, filters = {}) {
    const where = { tenantId, role: "staff" };

    return db.user.findAll({
      where,
      attributes: ["id", "username", "email", "name", "role"],
      limit: filters.limit || 100,
      offset: filters.offset || 0,
    });
  },

  async findById(id, tenantId) {
    return db.user.findOne({
      where: { id, tenantId, role: "staff" },
      attributes: ["id", "username", "email", "name", "role"],
    });
  },

  async create(data) {
    return db.user.create(data);
  },

  async update(id, tenantId, data) {
    const record = await this.findById(id, tenantId);
    if (!record) return null;
    await record.update(data);
    return record;
  },

  async delete(id, tenantId) {
    const record = await this.findById(id, tenantId);
    if (!record) return false;
    await record.destroy();
    return true;
  },
};

module.exports = staffDAO;
