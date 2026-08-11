"use strict";

const db = require("../../../db/models");

const Op = db.Sequelize.Op;

const expenseDAO = {
  async findAll(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.locationId) {
      where.locationId = filters.locationId;
    }
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date[Op.gte] = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date[Op.lte] = new Date(filters.endDate);
      }
    }

    return db.expense.findAll({
      where,
      include: filters.locationId
        ? undefined
        : [
            {
              model: db.location,
              as: "location",
              attributes: ["id", "name"],
            },
          ],
      order: [["date", "DESC"]],
    });
  },

  async findById(id, tenantId) {
// codacy-suppress NoSqlInjection
    return db.expense.findOne({
      where: { id, tenantId },
    });
  },

  async create(data, tenantId) {
    return db.expense.create({ ...data, tenantId });
  },

  async update(id, tenantId, updates) {
    const expense = await db.expense.findOne({ where: { id, tenantId } });
    if (!expense) return null;
    await expense.update(updates);
    return expense;
  },

  async delete(id, tenantId) {
    const expense = await db.expense.findOne({ where: { id, tenantId } });
    if (!expense) return false;
    await expense.destroy();
    return true;
  },
};

module.exports = expenseDAO;
