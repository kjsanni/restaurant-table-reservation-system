"use strict";
const { Op } = require("sequelize");
const salonModels = require("../models");

const appointmentDao = {
  async findAllForTenant(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.source) where.source = filters.source;
    if (filters.from) where.start = { [Op.gte]: filters.from };
    if (filters.to) {
      where.start = where.start || {};
      where.start[Op.lte] = filters.to;
    }
    if (filters.stylistId) where.stylistId = filters.stylistId;
    if (filters.stationId) where.stationId = filters.stationId;
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;

    const { count, rows } = await salonModels.sequelize.models.appointment.findAndCountAll({
      where,
      include: [
        { model: salonModels.sequelize.models.customer, as: "customer", attributes: ["id", "firstName", "lastName", "phone", "email"] },
        { model: salonModels.sequelize.models.service, as: "service", attributes: ["id", "name", "price", "durationMinutes"] },
        { model: salonModels.sequelize.models.station, as: "station", attributes: ["id", "name", "type", "zone"] },
        { model: salonModels.sequelize.models.user, as: "stylist", attributes: ["id", "name", "email"] },
      ],
      order: [["start", "DESC"]],
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    });
    return { total: count, data: rows };
  },

  async findById(id, tenantId) {
    return salonModels.sequelize.models.appointment.findOne({
      where: { id, tenantId },
      include: [
        { model: salonModels.sequelize.models.customer, as: "customer" },
        { model: salonModels.sequelize.models.service, as: "service" },
        { model: salonModels.sequelize.models.station, as: "station" },
        { model: salonModels.sequelize.models.user, as: "stylist" },
      ],
    });
  },

  async create(data) {
    return salonModels.sequelize.models.appointment.create(data);
  },

  async update(id, tenantId, data) {
    const [affected] = await salonModels.sequelize.models.appointment.update(data, {
      where: { id, tenantId },
      returning: true,
    });
    if (!affected) return null;
    return salonModels.sequelize.models.appointment.findByPk(id);
  },

  async delete(id, tenantId) {
    const appointment = await salonModels.sequelize.models.appointment.findOne({
      where: { id, tenantId },
    });
    if (!appointment) return false;
    await appointment.destroy();
    return true;
  },

  async findConflicts(tenantId, stationId, stylistId, start, durationMinutes, excludeId = null) {
    const end = new Date(new Date(start).getTime() + durationMinutes * 60000);
    const where = {
      tenantId,
      status: { [Op.notIn]: ["cancelled", "no_show"] },
      start: { [Op.lt]: end },
    };

    const orConditions = [];
    if (stationId) {
      orConditions.push({
        stationId,
        start: {
          [Op.lt]: end,
        },
      });
    }
    if (stylistId) {
      orConditions.push({
        stylistId,
        start: {
          [Op.lt]: end,
        },
      });
    }

    const query = {
      where: {
        ...where,
        [Op.or]: orConditions,
      },
      include: [
        { model: salonModels.sequelize.models.service, as: "service" },
        { model: salonModels.sequelize.models.station, as: "station" },
        { model: salonModels.sequelize.models.user, as: "stylist" },
      ],
    };

    const existing = await salonModels.sequelize.models.appointment.findAll(query);

    return existing.filter((apt) => {
      if (excludeId && apt.id === excludeId) return false;
      const aptEnd = new Date(new Date(apt.start).getTime() + apt.durationMinutes * 60000);
      const aptStart = apt.start;
      return new Date(start) < aptEnd && end > new Date(aptStart);
    });
  },
};

module.exports = appointmentDao;
