"use strict";
const salonModels = require("../models");

const stationDao = {
  async findAllForTenant(tenantId, filters = {}) {
    const where = { tenantId };
    if (filters.type) where.type = filters.type;
    if (filters.zone) where.zone = filters.zone;
    if (filters.isOccupied !== undefined) where.isOccupied = filters.isOccupied;
    if (filters.isBlocked !== undefined) where.isBlocked = filters.isBlocked;
    if (filters.floorPlanId) where.floorPlanId = filters.floorPlanId;

    const { count, rows } = await salonModels.sequelize.models.station.findAndCountAll({
      where,
      include: [
        {
          model: salonModels.sequelize.models.floorPlan,
          as: "floorPlan",
          attributes: ["id", "name"],
        },
      ],
      order: [["zone", "ASC"], ["name", "ASC"]],
      limit: filters.limit || 100,
      offset: filters.offset || 0,
    });
    return { total: count, data: rows };
  },

  async findById(id, tenantId) {
    return salonModels.sequelize.models.station.findOne({
      where: { id, tenantId },
      include: [
        {
          model: salonModels.sequelize.models.floorPlan,
          as: "floorPlan",
          attributes: ["id", "name"],
        },
      ],
    });
  },

  async create(data) {
    return salonModels.sequelize.models.station.create(data);
  },

  async update(id, tenantId, data) {
    const [affected] = await salonModels.sequelize.models.station.update(data, {
      where: { id, tenantId },
      returning: true,
    });
    if (!affected) return null;
    return salonModels.sequelize.models.station.findByPk(id);
  },

  async delete(id, tenantId) {
    const station = await salonModels.sequelize.models.station.findOne({
      where: { id, tenantId },
    });
    if (!station) return false;
    await station.destroy();
    return true;
  },

  async getUtilization(tenantId, start, end) {
    const { Op } = require("sequelize");
    const { count: totalStations } = await salonModels.sequelize.models.station.findAndCountAll({
      where: { tenantId, isBlocked: false },
    });

    if (totalStations === 0) return { utilizationPercent: 0, occupiedCount: 0, totalCount: 0 };

    const { count: occupiedCount } = await salonModels.sequelize.models.appointment.findAndCountAll({
      where: {
        tenantId,
        status: ["pending", "confirmed", "in_progress"],
        start: { [Op.lt]: end },
      },
      include: [
        {
          model: salonModels.sequelize.models.service,
          as: "service",
          required: true,
          where: {},
        },
        {
          model: salonModels.sequelize.models.station,
          as: "station",
          required: true,
          where: { tenantId },
        },
      ],
    });

    const utilizationPercent = Math.round((occupiedCount / totalStations) * 100);
    return { utilizationPercent, occupiedCount, totalCount: totalStations };
  },
};

module.exports = stationDao;
