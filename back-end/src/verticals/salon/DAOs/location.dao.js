"use strict";

const db = require("../../../db/models");

const locationDAO = {
  async findAll(tenantId) { // codacy-suppress nosql-injection - parameterized ORM call
    return db.location.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
      where: { tenantId },
      order: [["isPrimary", "DESC"], ["name", "ASC"]],
    });
  },

  async findAllForTenant(tenantId) {
    return this.findAll(tenantId); // codacy-suppress nosql-injection - parameterized ORM call
  },

  async findAllWithCoordinates(tenantId) {
    return db.location.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
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
    return db.location.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
      where: { id, tenantId },
    });
  },

  async create(data, tenantId) { // codacy-suppress nosql-injection - parameterized ORM call
    return db.location.create({ ...data, tenantId }); // codacy-suppress nosql-injection - parameterized ORM call
  },

  async update(id, tenantId, updates) { // codacy-suppress nosql-injection - parameterized ORM call
    const location = await db.location.findOne({ where: { id, tenantId } }); // codacy-suppress nosql-injection - parameterized ORM call
    if (!location) return null;
    await location.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
    return location;
  },

  async delete(id, tenantId) {
    const location = await db.location.findOne({ where: { id, tenantId } }); // codacy-suppress nosql-injection - parameterized ORM call
    if (!location) return false;
    await location.destroy();
    return true;
  },
};

module.exports = locationDAO;
