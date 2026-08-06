"use strict";
const db = require("../../../db/models");
const Op = db.Sequelize.Op;

const inventoryTransferDAO = {
  async findAllForTenant(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.inventoryItemId) {
      where.inventoryItemId = filters.inventoryItemId;
    }
    if (filters.fromLocationId) {
      where.fromLocationId = filters.fromLocationId;
    }
    if (filters.toLocationId) {
      where.toLocationId = filters.toLocationId;
    }

    return db.inventoryTransfer.findAll({
      where,
      include: [
        {
          model: db.location,
          as: "fromLocation",
          attributes: ["id", "name"],
        },
        {
          model: db.location,
          as: "toLocation",
          attributes: ["id", "name"],
        },
        {
          model: db.inventoryItem,
          as: "inventoryItem",
          attributes: ["id", "name", "sku"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: filters.limit || 100,
      offset: filters.offset || 0,
    });
  },

  async findById(id, tenantId) {
    return db.inventoryTransfer.findOne({
      where: { id, tenantId },
      include: [
        {
          model: db.location,
          as: "fromLocation",
          attributes: ["id", "name"],
        },
        {
          model: db.location,
          as: "toLocation",
          attributes: ["id", "name"],
        },
        {
          model: db.inventoryItem,
          as: "inventoryItem",
          attributes: ["id", "name", "sku"],
        },
      ],
    });
  },

  async create(data, tenantId) {
    return db.inventoryTransfer.create({ ...data, tenantId });
  },

  async update(id, tenantId, updates) {
    const transfer = await db.inventoryTransfer.findOne({
      where: { id, tenantId },
    });
    if (!transfer) return null;
    await transfer.update(updates);
    return transfer;
  },

  async delete(id, tenantId) {
    const transfer = await db.inventoryTransfer.findOne({
      where: { id, tenantId },
    });
    if (!transfer) return false;
    await transfer.destroy();
    return true;
  },
};

module.exports = inventoryTransferDAO;
