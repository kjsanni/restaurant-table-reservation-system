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
    if (filters.locationId) where.locationId = filters.locationId;

    const { count, rows } = await salonModels.sequelize.models.appointment.findAndCountAll({
      where,
      include: [
        { model: salonModels.sequelize.models.customer, as: "customer", attributes: ["id", "firstName", "lastName", "phone", "email"] },
        { model: salonModels.sequelize.models.service, as: "service", attributes: ["id", "name", "price", "durationMinutes"] },
        { model: salonModels.sequelize.models.station, as: "station", attributes: ["id", "name", "type", "zone"] },
        { model: salonModels.sequelize.models.user, as: "stylist", attributes: ["id", "username", "email"] },
        { model: salonModels.sequelize.models.location, as: "location", attributes: ["id", "name", "city", "region"], required: false },
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
        { model: salonModels.sequelize.models.location, as: "location", attributes: ["id", "name", "city", "region"], required: false },
      ],
    });
  },

  async create(data) {
    const start = data.start ? new Date(data.start) : new Date();
    const durationMinutes = data.durationMinutes || 30;
    const bufferMinutes = data.bufferMinutes || 0;
    const end = new Date(start.getTime() + (durationMinutes + bufferMinutes) * 60000);
    return salonModels.sequelize.models.appointment.create({
      ...data,
      start,
      end,
      bufferMinutes,
    });
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

  async findConflicts(tenantId, stationId, stylistId, start, durationMinutes, excludeId = null, bufferMinutes = 0, locationId = null) {
    const end = new Date(new Date(start).getTime() + (durationMinutes + bufferMinutes) * 60000);
    const where = {
      tenantId,
      status: { [Op.notIn]: ["cancelled", "no_show"] },
      start: { [Op.lt]: end },
    };

    if (locationId) {
      where.locationId = locationId;
    }

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
      const aptBuffer = apt.bufferMinutes || 0;
      const aptEnd = new Date(new Date(apt.start).getTime() + (apt.durationMinutes + aptBuffer) * 60000);
      const aptStart = apt.start;
      return new Date(start) < aptEnd && end > new Date(aptStart);
    });
  },

  async getRevenueByService(tenantId, from, to, locationId) {
    const where = {
      tenantId,
      status: { [Op.notIn]: ["cancelled", "no_show"] },
    };
    if (locationId) where.locationId = locationId;
    if (from || to) {
      where.start = {};
      if (from) where.start[Op.gte] = new Date(from);
      if (to) where.start[Op.lte] = new Date(to);
    }

    const results = await salonModels.sequelize.models.appointment.findAll({
      where,
      include: [
        { model: salonModels.sequelize.models.service, as: "service", attributes: ["id", "name", "price"] },
      ],
      attributes: [
        [salonModels.sequelize.col("service.id"), "serviceId"],
        [salonModels.sequelize.col("service.name"), "serviceName"],
        [salonModels.sequelize.col("service.price"), "servicePrice"],
        [salonModels.sequelize.fn("COUNT", salonModels.sequelize.col("appointment.id")), "appointmentCount"],
        [salonModels.sequelize.fn("SUM", salonModels.sequelize.col("service.price")), "revenue"],
      ],
      group: ["service.id", "service.name", "service.price"],
      order: [[salonModels.sequelize.fn("SUM", salonModels.sequelize.col("service.price")), "DESC"]],
    });

    return results.map((row) => ({
      serviceId: row.get("serviceId"),
      serviceName: row.get("serviceName"),
      servicePrice: Number(row.get("servicePrice") || 0),
      appointmentCount: Number(row.get("appointmentCount") || 0),
      revenue: Number(row.get("revenue") || 0),
    }));
  },

  async getTopStylists(tenantId, from, to, locationId) {
    const where = {
      tenantId,
      status: { [Op.notIn]: ["cancelled", "no_show"] },
    };
    if (locationId) where.locationId = locationId;
    if (from || to) {
      where.start = {};
      if (from) where.start[Op.gte] = new Date(from);
      if (to) where.start[Op.lte] = new Date(to);
    }

    const results = await salonModels.sequelize.models.appointment.findAll({
      where,
      include: [
        { model: salonModels.sequelize.models.user, as: "stylist", attributes: ["id", "username", "email"] },
        { model: salonModels.sequelize.models.service, as: "service", attributes: ["id", "name", "price"] },
      ],
      attributes: [
        [salonModels.sequelize.col("stylist.id"), "stylistId"],
        [salonModels.sequelize.col("stylist.username"), "stylistName"],
        [salonModels.sequelize.col("stylist.email"), "stylistEmail"],
        [salonModels.sequelize.fn("COUNT", salonModels.sequelize.col("appointment.id")), "appointmentCount"],
        [salonModels.sequelize.fn("SUM", salonModels.sequelize.col("service.price")), "revenue"],
      ],
      group: ["stylist.id", "stylist.username", "stylist.email"],
      order: [[salonModels.sequelize.fn("SUM", salonModels.sequelize.col("service.price")), "DESC"]],
      limit: 10,
    });

    return results.map((row) => ({
      stylistId: row.get("stylistId"),
      stylistName: row.get("stylistName"),
      stylistEmail: row.get("stylistEmail"),
      appointmentCount: Number(row.get("appointmentCount") || 0),
      revenue: Number(row.get("revenue") || 0),
    }));
  },

  async getAppointmentsBySource(tenantId, from, to, locationId) {
    const where = {
      tenantId,
    };
    if (locationId) where.locationId = locationId;
    if (from || to) {
      where.start = {};
      if (from) where.start[Op.gte] = new Date(from);
      if (to) where.start[Op.lte] = new Date(to);
    }

    const results = await salonModels.sequelize.models.appointment.findAll({
      where,
      attributes: [
        "source",
        [salonModels.sequelize.fn("COUNT", salonModels.sequelize.col("appointment.id")), "appointmentCount"],
        [salonModels.sequelize.fn("SUM", salonModels.sequelize.col("appointment.durationMinutes")), "totalMinutes"],
      ],
      group: ["source"],
      order: [[salonModels.sequelize.fn("COUNT", salonModels.sequelize.col("appointment.id")), "DESC"]],
    });

    return results.map((row) => ({
      source: row.get("source") || "unknown",
      appointmentCount: Number(row.get("appointmentCount") || 0),
      totalMinutes: Number(row.get("totalMinutes") || 0),
    }));
  },

  async getPeakHours(tenantId, from, to, locationId) {
    const where = {
      tenantId,
      status: { [Op.notIn]: ["cancelled", "no_show"] },
    };
    if (locationId) where.locationId = locationId;
    if (from || to) {
      where.start = {};
      if (from) where.start[Op.gte] = new Date(from);
      if (to) where.start[Op.lte] = new Date(to);
    }

    const results = await salonModels.sequelize.models.appointment.findAll({
      where,
      attributes: [
        [salonModels.sequelize.fn("HOUR", salonModels.sequelize.col("appointment.start")), "hour"],
        [salonModels.sequelize.fn("DAYOFWEEK", salonModels.sequelize.col("appointment.start")), "dayOfWeek"],
        [salonModels.sequelize.fn("COUNT", salonModels.sequelize.col("appointment.id")), "appointmentCount"],
        [salonModels.sequelize.fn("SUM", salonModels.sequelize.col("appointment.durationMinutes")), "totalMinutes"],
      ],
      group: ["hour", "dayOfWeek"],
      order: [["hour", "ASC"], ["dayOfWeek", "ASC"]],
    });

    return results.map((row) => ({
      hour: Number(row.get("hour") || 0),
      dayOfWeek: Number(row.get("dayOfWeek") || 0),
      appointmentCount: Number(row.get("appointmentCount") || 0),
      totalMinutes: Number(row.get("totalMinutes") || 0),
    }));
  },

  async findExistingInstance(tenantId, customerId, serviceId, dateStr) {
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return salonModels.sequelize.models.appointment.findOne({
      where: {
        tenantId,
        customerId,
        serviceId,
        start: { [Op.gte]: start, [Op.lt]: end },
      },
    });
  },

  async getTodayStats(tenantId) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const where = {
      tenantId,
      start: { [Op.gte]: startOfDay, [Op.lt]: endOfDay },
      status: { [Op.notIn]: ["cancelled", "no_show"] },
    };

    const [appointmentsToday, clientsToday, revenueToday] = await Promise.all([
      salonModels.sequelize.models.appointment.count({ where }),
      salonModels.sequelize.models.appointment.count({
        where: { ...where, customerId: { [Op.notNull]: true } },
        distinct: true,
        col: "customerId",
      }),
      salonModels.sequelize.models.appointment.findAll({
        where,
        include: [
          {
            model: salonModels.sequelize.models.service,
            as: "service",
            attributes: ["price"],
            required: true,
          },
        ],
        attributes: [
          [salonModels.sequelize.fn("SUM", salonModels.sequelize.col("service.price")), "revenue"],
        ],
        raw: true,
      }),
    ]);

    const totalRevenue = revenueToday.length > 0 ? Number(revenueToday[0].revenue || 0) : 0;

    return {
      appointmentsToday: Number(appointmentsToday || 0),
      clientsToday: Number(clientsToday || 0),
      revenueToday: totalRevenue,
    };
  },

  async getLocationSummary(tenantId, from, to) {
    const where = {
      tenantId,
      status: { [Op.notIn]: ["cancelled", "no_show"] },
    };
    if (from || to) {
      where.start = {};
      if (from) where.start[Op.gte] = new Date(from);
      if (to) where.start[Op.lte] = new Date(to);
    }

    const results = await salonModels.sequelize.models.appointment.findAll({
      where,
      include: [
        { model: salonModels.sequelize.models.location, as: "location", attributes: ["id", "name", "city", "region"], required: false },
        { model: salonModels.sequelize.models.service, as: "service", attributes: ["price"], required: true },
      ],
      attributes: [
        [salonModels.sequelize.col("location.id"), "locationId"],
        [salonModels.sequelize.col("location.name"), "locationName"],
        [salonModels.sequelize.col("location.city"), "locationCity"],
        [salonModels.sequelize.fn("COUNT", salonModels.sequelize.col("appointment.id")), "appointmentCount"],
        [salonModels.sequelize.fn("SUM", salonModels.sequelize.col("service.price")), "revenue"],
      ],
      group: ["location.id", "location.name", "location.city"],
      order: [[salonModels.sequelize.fn("SUM", salonModels.sequelize.col("service.price")), "DESC"]],
      raw: true,
    });

    return results.map((row) => ({
      locationId: row.get("locationId"),
      locationName: row.get("locationName"),
      locationCity: row.get("locationCity"),
      appointmentCount: Number(row.get("appointmentCount") || 0),
      revenue: Number(row.get("revenue") || 0),
    }));
  },
};

module.exports = appointmentDao;
