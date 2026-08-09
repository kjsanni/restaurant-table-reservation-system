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
  if (typeof date !== "string") return false;
  try {
    // nosemgrep
    const holiday = await Holiday.findOne({ where: { date } });
    return !!holiday;
  } catch {
    return false;
  }
};

const isWithinShift = async (tenantId, userId, datetime, locationId) => {
  try {
    const date = new Date(datetime);
    const dayOfWeek = date.toLocaleLowerCase("en-US", { weekday: "long" });
    const timeOnly = date.toTimeString().slice(0, 8);
    const where = { userId: Number(userId), dayOfWeek };
    if (locationId) where.locationId = Number(locationId);
    // nosemgrep
    const shift = await StaffShift.findOne({ where });
    if (!shift) return false;
    return timeOnly >= shift.startTime && timeOnly <= shift.endTime;
  } catch {
    return false;
  }
};

const buildAppointmentWhereClause = (tenantId, locationId, startCondition) => {
  const where = {
    tenantId,
    status: { [Op.notIn]: ["cancelled", "no_show"] },
    ...startCondition,
  };
  if (locationId) where.locationId = Number(locationId);
  return where;
};

const buildAppointmentIncludeClause = (stationId, stylistId) => [
  {
    model: salonModels.sequelize.models.service,
    as: "service",
    required: true,
  },
  {
    model: salonModels.sequelize.models.station,
    as: "station",
    required: false,
    where: stationId ? { id: Number(stationId) } : undefined,
  },
  {
    model: salonModels.sequelize.models.user,
    as: "stylist",
    required: false,
    where: stylistId ? { id: Number(stylistId) } : undefined,
  },
];

const fetchOverlappingAppointments = async (tenantId, locationId, extendedEnd, stationId, stylistId, start) => {
  const appointmentWhere = buildAppointmentWhereClause(tenantId, locationId, {
    start: { [Op.lt]: extendedEnd },
  });
  const includeClause = buildAppointmentIncludeClause(stationId, stylistId);

  const apts = await salonModels.sequelize.models.appointment.findAll({
    where: appointmentWhere,
    include: includeClause,
  });

  return apts.filter((apt) => {
    const aptEnd = buildExtendedEnd(apt.start, apt.durationMinutes, apt.bufferMinutes || 0);
    return new Date(start) < aptEnd && extendedEnd > new Date(apt.start);
  });
};

const collectConflicts = (apts, stationId, stylistId) => {
  const conflicts = { station: [], stylist: [] };
  for (const apt of apts) {
    if (stationId && apt.stationId === Number(stationId)) {
      conflicts.station.push(apt);
    }
    if (stylistId && apt.stylistId === Number(stylistId)) {
      conflicts.stylist.push(apt);
    }
  }
  return conflicts;
};

const buildSlotsForWorkday = (startOfWork, endOfWork, duration, bufferMinutes, occupiedRanges, slotInterval = 30) => {
  const slots = [];
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
};

const appointmentSchedulingService = {
  async checkConflicts(tenantId, stationId, stylistId, start, durationMinutes, bufferMinutes = 0, excludeId = null, locationId) {
    const extendedEnd = buildExtendedEnd(start, durationMinutes, bufferMinutes);
    const conflicts = { station: [], stylist: [], holiday: false };

    const dateOnly = new Date(start).toISOString().split("T")[0];
    conflicts.holiday = await isHoliday(tenantId, dateOnly);

    const apts = await fetchOverlappingAppointments(
      tenantId, locationId, extendedEnd, stationId, stylistId, start
    );

    const filtered = apts.filter((apt) => {
      if (excludeId && apt.id === excludeId) return false;
      return true;
    });

    const collected = collectConflicts(filtered, stationId, stylistId);
    conflicts.station.push(...collected.station);
    conflicts.stylist.push(...collected.stylist);

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
    const service = await salonModels.sequelize.models.service.findByPk(Number(serviceId));
    if (!service) throw new Error("Service not found");

    const bufferMinutes = service.bufferMinutes || 0;
    const duration = service.durationMinutes;
    const startOfWork = new Date(date);
    startOfWork.setHours(8, 0, 0, 0);
    const endOfWork = new Date(date);
    endOfWork.setHours(20, 0, 0, 0);

    const isHolidy = await isHoliday(tenantId, date);
    if (isHolidy) return [];

    const appointmentWhere = buildAppointmentWhereClause(tenantId, locationId, {
      start: { [Op.gte]: startOfWork, [Op.lt]: endOfWork },
    });
    const includeClause = buildAppointmentIncludeClause(stationId, stylistId);

    const apts = await salonModels.sequelize.models.appointment.findAll({
      where: appointmentWhere,
      include: includeClause,
    });

    const occupiedRanges = apts.map((apt) => {
      const aptStart = new Date(apt.start);
      const aptEnd = buildExtendedEnd(apt.start, apt.durationMinutes, apt.bufferMinutes || 0);
      const ranges = [];
      if (!stationId || apt.stationId === Number(stationId)) {
        ranges.push({ type: "station", start: aptStart, end: aptEnd });
      }
      if (!stylistId || apt.stylistId === Number(stylistId)) {
        ranges.push({ type: "stylist", start: aptStart, end: aptEnd });
      }
      return ranges;
    }).flat();

    return buildSlotsForWorkday(startOfWork, endOfWork, duration, bufferMinutes, occupiedRanges);
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
