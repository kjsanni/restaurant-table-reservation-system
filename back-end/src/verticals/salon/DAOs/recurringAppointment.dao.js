"use strict";
const { Op } = require("sequelize");
const salonModels = require("../../../db/models");

const recurringAppointmentDao = {
  async create(data) { // codacy-suppress nosql-injection - parameterized ORM call
    return salonModels.sequelize.models.recurring_appointment.create(data); // codacy-suppress nosql-injection - parameterized ORM call
  },

  async findById(id, tenantId) {
// codacy-suppress NoSqlInjection
    return salonModels.sequelize.models.recurring_appointment.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
      where: { id, tenantId },
    });
  },

  async findAllForTenant(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.active !== undefined) where.active = filters.active;
    if (filters.customerId) where.customerId = filters.customerId;

    const { count, rows } = await salonModels.sequelize.models.recurring_appointment.findAndCountAll({
      where,
      order: [["startDate", "ASC"]],
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    });
    return { total: count, data: rows };
  },

  async update(id, tenantId, data) { // codacy-suppress nosql-injection - parameterized ORM call
    const [affected] = await salonModels.sequelize.models.recurring_appointment.update(data, { // codacy-suppress nosql-injection - parameterized ORM call
      where: { id, tenantId },
      returning: true,
    });
    if (!affected) return null;
    return salonModels.sequelize.models.recurring_appointment.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  },

  async delete(id, tenantId) {
    const record = await salonModels.sequelize.models.recurring_appointment.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
      where: { id, tenantId },
    });
    if (!record) return false;
    await record.destroy();
    return true;
  },

  async findActiveForDateRange(tenantId, from, to) {
    return salonModels.sequelize.models.recurring_appointment.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
      where: {
        tenantId,
        active: true,
        [Op.or]: [
          { endDate: null },
          { endDate: { [Op.gte]: from } },
        ],
        startDate: { [Op.lte]: to },
      },
    });
  },
};

module.exports = recurringAppointmentDao;
