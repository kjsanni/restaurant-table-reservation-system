"use strict";

const db = require("../../../db/models");

const Op = db.Sequelize.Op;

const servicePackageDAO = {
  async findAll(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable;
    }
    if (filters.search) {
      where.name = { [Op.like]: `%${filters.search}%` };
    }

    return db.servicePackage.findAll({
      where,
      include: [
        {
          model: db.service,
          as: "services",
          through: { attributes: ["quantity", "sortOrder"] },
        },
      ],
      order: [["sortOrder", "ASC"], ["name", "ASC"]],
    });
  },

  async findById(id, tenantId) {
    return db.servicePackage.findOne({
      where: { id, tenantId },
      include: [
        {
          model: db.service,
          as: "services",
          through: { attributes: ["quantity", "sortOrder"] },
        },
      ],
    });
  },

  async create(data, tenantId) {
    return db.servicePackage.create({ ...data, tenantId });
  },

  async update(id, tenantId, updates) {
    const pkg = await db.servicePackage.findOne({ where: { id, tenantId } });
    if (!pkg) return null;

    await pkg.update(updates);
    return this.findById(id, tenantId);
  },

  async delete(id, tenantId) {
    const pkg = await db.servicePackage.findOne({ where: { id, tenantId } });
    if (!pkg) return false;

    await pkg.destroy();
    return true;
  },
};

module.exports = servicePackageDAO;
