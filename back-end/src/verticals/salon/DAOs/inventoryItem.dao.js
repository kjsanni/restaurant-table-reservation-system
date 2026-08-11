"use strict";

const db = require("../../../db/models");

const Op = db.Sequelize.Op;

const inventoryItemDAO = {
  async findAll(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.search) {
      where.name = { [Op.like]: `%${filters.search}%` };
    }
    if (filters.locationId) {
      where.locationId = filters.locationId;
    }

    return db.inventoryItem.findAll({
      where,
      order: [["name", "ASC"]],
      include: filters.locationId
        ? undefined
        : [
            {
              model: db.location,
              as: "location",
              attributes: ["id", "name"],
            },
          ],
    });
  },

  async findById(id, tenantId) {
// codacy-suppress NoSqlInjection
    return db.inventoryItem.findOne({
      where: { id, tenantId },
    });
  },

  async create(data, tenantId) {
    return db.inventoryItem.create({ ...data, tenantId });
  },

  async update(id, tenantId, updates) {
    const item = await db.inventoryItem.findOne({ where: { id, tenantId } });
    if (!item) return null;
    await item.update(updates);
    return item;
  },

  async delete(id, tenantId) {
    const item = await db.inventoryItem.findOne({ where: { id, tenantId } });
    if (!item) return false;
    await item.destroy();
    return true;
  },

  async findLowStock(tenantId) {
    return db.inventoryItem.findAll({
      where: {
        tenantId,
        isActive: true,
        quantity: { [Op.lte]: db.sequelize.col("reorderLevel") },
      },
      order: [["quantity", "ASC"]],
    });
  },
};

module.exports = inventoryItemDAO;
