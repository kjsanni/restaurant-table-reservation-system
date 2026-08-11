"use strict";

const db = require("../../../db/models");

const Op = db.Sequelize.Op;

const referralDAO = {
  async findAll(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.code = { [Op.like]: `%${filters.search}%` };
    }

    return db.referral.findAll({
      where,
      include: [
        {
          model: db.customer,
          as: "referrer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: db.customer,
          as: "referee",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: db.appointment,
          as: "appointment",
          attributes: ["id", "start", "status"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  },

  async findById(id, tenantId) {
// codacy-suppress NoSqlInjection
    return db.referral.findOne({
      where: { id, tenantId },
      include: [
        {
          model: db.customer,
          as: "referrer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: db.customer,
          as: "referee",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: db.appointment,
          as: "appointment",
          attributes: ["id", "start", "status"],
        },
      ],
    });
  },

  async findByCode(code, tenantId) {
    return db.referral.findOne({
      where: { code, tenantId },
      include: [
        {
          model: db.customer,
          as: "referrer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: db.customer,
          as: "referee",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });
  },

  async create(data, tenantId) {
    return db.referral.create({ ...data, tenantId });
  },

  async update(id, tenantId, updates) {
    const referral = await db.referral.findOne({ where: { id, tenantId } });
    if (!referral) return null;
    await referral.update(updates);
    return this.findById(id, tenantId);
  },

  async delete(id, tenantId) {
    const referral = await db.referral.findOne({ where: { id, tenantId } });
    if (!referral) return false;
    await referral.destroy();
    return true;
  },
};

module.exports = referralDAO;
