"use strict";
const salonModels = require("../models");

const serviceDao = {
  async findAllForTenant(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.isAvailable !== undefined) where.isAvailable = filters.isAvailable;
    if (filters.whatsappBookable !== undefined) where.whatsappBookable = filters.whatsappBookable;
    if (filters.locationId) where.locationId = filters.locationId;
    if (filters.search) {
      where.name = { [require("sequelize").Op.iLike]: `%${filters.search}%` };
    }

    const { count, rows } = await salonModels.sequelize.models.service.findAndCountAll({
      where,
      include: [
        { model: salonModels.sequelize.models.serviceCategory, as: "category", attributes: ["id", "name"] },
      ],
      order: [["sortOrder", "ASC"], ["name", "ASC"]],
      limit: filters.limit || 100,
      offset: filters.offset || 0,
    });
    return { total: count, data: rows };
  },

  async findById(id, tenantId) {
// codacy-suppress NoSqlInjection
    return salonModels.sequelize.models.service.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
      where: { id, tenantId },
      include: [{ model: salonModels.sequelize.models.serviceCategory, as: "category" }],
    });
  },

  async create(data) { // codacy-suppress nosql-injection - parameterized ORM call
    return salonModels.sequelize.models.service.create(data); // codacy-suppress nosql-injection - parameterized ORM call
  },

  async update(id, tenantId, data) { // codacy-suppress nosql-injection - parameterized ORM call
    const [affected] = await salonModels.sequelize.models.service.update(data, { // codacy-suppress nosql-injection - parameterized ORM call
      where: { id, tenantId },
      returning: true,
    });
    if (!affected) return null;
    return salonModels.sequelize.models.service.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  },

  async delete(id, tenantId) {
    const service = await salonModels.sequelize.models.service.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
      where: { id, tenantId },
    });
    if (!service) return false;
    await service.destroy();
    return true;
  },
};

module.exports = serviceDao;
