"use strict";
const db = require("../../../db/models");
const Op = db.Sequelize.Op;

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
};

module.exports = staffDAO;
