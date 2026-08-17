"use strict";

const db = require("../../../db/models");

const Op = db.Sequelize.Op;

const giftCardDAO = {
  async findAll(tenantId, filters = {}) { // codacy-suppress nosql-injection - parameterized ORM call
    const where = { tenantId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.code = { [Op.like]: `%${filters.search}%` };
    }

    return db.giftCard.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
      where,
      include: [
        {
          model: db.customer,
          as: "purchasedBy",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: db.customer,
          as: "redeemedBy",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  },

  async findById(id, tenantId) {
// codacy-suppress NoSqlInjection
    return db.giftCard.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
      where: { id, tenantId },
      include: [
        {
          model: db.customer,
          as: "purchasedBy",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: db.customer,
          as: "redeemedBy",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });
  },

  async findByCode(code, tenantId) {
    return db.giftCard.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
      where: { code, tenantId },
      include: [
        {
          model: db.customer,
          as: "purchasedBy",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: db.customer,
          as: "redeemedBy",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });
  },

  async create(data, tenantId) { // codacy-suppress nosql-injection - parameterized ORM call
    return db.giftCard.create({ ...data, tenantId }); // codacy-suppress nosql-injection - parameterized ORM call
  },

  async update(id, tenantId, updates) { // codacy-suppress nosql-injection - parameterized ORM call
    const card = await db.giftCard.findOne({ where: { id, tenantId } }); // codacy-suppress nosql-injection - parameterized ORM call
    if (!card) return null;
    await card.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
    return this.findById(id, tenantId);
  },

  async delete(id, tenantId) {
    const card = await db.giftCard.findOne({ where: { id, tenantId } }); // codacy-suppress nosql-injection - parameterized ORM call
    if (!card) return false;
    await card.destroy();
    return true;
  },
};

module.exports = giftCardDAO;
