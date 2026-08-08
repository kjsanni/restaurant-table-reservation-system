"use strict";
const { Op } = require("sequelize");
const salonModels = require("../../../db/models");
const dbModels = require("../../../db/models");
const Holiday = dbModels.holiday;
const StaffShift = dbModels.staffShift;

const buildExtendedEnd = (start, durationMinutes, bufferMinutes) => {
  return new Date(new Date(start).getTime() + (durationMinutes + bufferMinutes) * 60000);
};

const isHoliday = async (tenantId, date) => {
  try {
    const holiday = await Holiday.findOne({ where: { date } });
    return !!holiday;
  } catch {
    return false;
  }
};

const isWithinShift = async (tenantId, userId, datetime, locationId) => {
  try {
    const where = { userId };
    if (locationId) where.locationId = locationId;
    const shift = await StaffShift.findOne({ where });
    return !!shift;
  } catch {
    return false;
  }
};

const buildAppointmentWhere = (tenantId, extendedEnd, locationId) => {
  const where = {
    tenantId,
    status: { [Op.notIn]: ["cancelled", "no_show"] },
    start: { [Op.lt]: extendedEnd },
  };
  if (locationId) where.locationId = locationId;
  return where;
};

const buildIncludeClause = (stationId, stylistId) => {
  const includeClause = [
    {
      model: salonModels.sequelize.models.service,
      as: "service",
      required: true,
    },
    {
      model: salonModels.sequelize.models.station,
      as: "station",
      required: false,
      where: stationId ? { id: stationId } : undefined,
    },
    {
      model: salonModels.sequelize.models.user,
      as: "stylist",
      required: false,
      where: stylistId ? { id: stylistId } : undefined,
    },
  ];
  return includeClause;
};

const appointmentSchedulingService = {
  async checkConflicts(tenantId, stationId, stylistId, start, durationMinutes, bufferMinutes = 0, excludeId = null, locationId) {
    const extendedEnd = buildExtendedEnd(start, durationMinutes, bufferMinutes);
    const { Op } = require("sequelize");
    const conflicts = {
      station: [],
      stylist: [],
      holiday: false,
    };

    const dateOnly = new Date(start).toISOString().split("T")[0];
    conflicts.holiday = await isHoliday(tenantId, dateOnly);

    const apts = await salonModels.sequelize.models.appointment.findAll({
      where: buildAppointmentWhere(tenantId, extendedEnd, locationId),
      include: buildIncludeClause(stationId, stylistId),
    });

    const filtered = apts.filter((apt) => {
      if (excludeId && apt.id === excludeId) return false;
      const aptEnd = buildExtendedEnd(apt.start, apt.durationMinutes, apt.bufferMinutes || 0);
      const aptStart = apt.start;
      return new Date(start) < aptEnd && extendedEnd > new Date(aptStart);
    });

    for (const apt of filtered) {
      if (stationId && apt.stationId === stationId) {
        conflicts.station.push(apt);
      }
      if (stylistId && apt.stylistId === stylistId) {
        conflicts.stylist.push(apt);
      }
    }

    if (stylistId) {
      const withinShift = await isWithinShift(tenantId, stylistId, new Date(start), locationId);
      if (!withinShift) {
        conflicts.stylist.push({
          _shiftViolation: true,
          message: "Stylist is not scheduled for this time",
        });
      }
    }

    const hasAnyConflict =
      conflicts.holiday ||
      conflicts.station.length > 0 ||
      conflicts.stylist.some((c) => !c._shiftViolation);

    return {
      hasConflict: hasAnyConflict,
      conflicts,
      stationOccupied: conflicts.station.length > 0,
      stylistOccupied: conflicts.stylist.some((c) => !c._shiftViolation),
      shiftViolation: conflicts.stylist.some((c) => c._shiftViolation),
    };
  },

  async findAvailableSlots(tenantId, serviceId, date, stylistId = null, stationId = null, locationId = null) {
    const service = await salonModels.sequelize.models.service.findByPk(serviceId);
    if (!service) throw new Error("Service not found");

    const bufferMinutes = service.bufferMinutes || 0;
    const duration = service.durationMinutes;
    const startOfWork = new Date(date);
    startOfWork.setHours(8, 0, 0, 0);
    const endOfWork = new Date(date);
    endOfWork.setHours(20, 0, 0, 0);

    const isHolidy = await isHoliday(tenantId, date);
    if (isHolidy) return [];

    const apts = await salonModels.sequelize.models.appointment.findAll({
      where: buildAppointmentWhere(tenantId, endOfWork, locationId),
      include: buildIncludeClause(stationId, stylistId),
    });

    const occupiedRanges = apts.map((apt) => {
      const aptStart = new Date(apt.start);
      const aptEnd = buildExtendedEnd(apt.start, apt.durationMinutes, apt.bufferMinutes || 0);
      const ranges = [];
      if (!stationId || apt.stationId === stationId) {
        ranges.push({ type: "station", start: aptStart, end: aptEnd });
      }
      if (!stylistId || apt.stylistId === stylistId) {
        ranges.push({ type: "stylist", start: aptStart, end: aptEnd });
      }
      return ranges;
    }).flat();

    const slots = [];
    const slotInterval = 30;
    const current = new Date(startOfWork);

    while (current.getTime() + duration * 60000 <= endOfWork.getTime()) {
      const slotEnd = buildExtendedEnd(current, duration, bufferMinutes);
      const hasConflict = occupiedRanges.some(
        (range) => current < range.end && slotEnd > range.start
      );

      if (!hasConflict) {
        slots.push({
          start: new Date(current).toISOString(),
          end: slotEnd.toISOString(),
          available: true,
        });
      }
      current.setMinutes(current.getMinutes() + slotInterval);
    }

    return slots;
  },

  async getSalonCommissionConfig(tenantId) {
    try {
      const setting = await salonModels.sequelize.models.setting.findOne({
        where: { key: "salon_commission_config", tenantId },
      });
      if (setting && setting.value) {
        return JSON.parse(setting.value);
      }
    } catch {
      // ignore parse errors
    }
    return {};
  },

  async createCommissionForAppointment(appointment) {
    const config = await this.getSalonCommissionConfig(appointment.tenantId);
    if (!config || config.enabled === false) {
      return null;
    }

    const service = await salonModels.sequelize.models.service.findByPk(appointment.serviceId);
    const servicePrice = service?.price || 0;
    if (servicePrice <= 0 || !appointment.stylistId) {
      return null;
    }

    const rateType = config.defaultRateType || "percentage";
    const rateValue = Number(config.defaultRateValue || 0);
    if (!rateValue || rateValue <= 0) {
      return null;
    }

    const amount =
      rateType === "percentage"
        ? (servicePrice * rateValue) / 100
        : rateValue;

    const commission = await salonModels.sequelize.models.commission.create({
      tenantId: appointment.tenantId,
      userId: appointment.stylistId,
      appointmentId: appointment.id,
      serviceId: appointment.serviceId,
      amount: Math.round(amount * 100) / 100,
      rateType,
      rateValue,
      status: "pending",
    });

    return commission;
  },
};

module.exports = appointmentSchedulingService;
