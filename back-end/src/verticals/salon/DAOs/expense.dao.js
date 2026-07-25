"use strict";

const db = require("../../../db/models");

const Op = db.Sequelize.Op;

const expenseDAO = {
  async findAll(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.category) {
      where.category = filters.category;
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
      order: [["date", "DESC"]],
    });
  },

  async findById(id, tenantId) {
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
