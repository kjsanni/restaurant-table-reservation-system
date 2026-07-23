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

const isWithinShift = async (tenantId, userId, datetime) => {
  try {
    const shift = await StaffShift.findOne({ where: { userId } });
    return !!shift;
  } catch {
    return false;
  }
};

const appointmentSchedulingService = {
  async checkConflicts(tenantId, stationId, stylistId, start, durationMinutes, bufferMinutes = 0, excludeId = null) {
    const extendedEnd = buildExtendedEnd(start, durationMinutes, bufferMinutes);
    const { Op } = require("sequelize");
    const conflicts = {
      station: [],
      stylist: [],
      holiday: false,
    };

    const dateOnly = new Date(start).toISOString().split("T")[0];
    conflicts.holiday = await isHoliday(tenantId, dateOnly);

    const appointmentWhere = {
      tenantId,
      status: { [Op.notIn]: ["cancelled", "no_show"] },
      start: { [Op.lt]: extendedEnd },
    };

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

    const apts = await salonModels.sequelize.models.appointment.findAll({
      where: appointmentWhere,
      include: includeClause,
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
      const withinShift = await isWithinShift(tenantId, stylistId, new Date(start));
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

  async findAvailableSlots(tenantId, serviceId, date, stylistId = null, stationId = null) {
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

    const slots = [];
    const slotInterval = 30;
    const current = new Date(startOfWork);

    while (current.getTime() + duration * 60000 <= endOfWork.getTime()) {
      const slotEnd = buildExtendedEnd(current, duration, bufferMinutes);
      const conflict = await this.checkConflicts(
        tenantId,
        stationId,
        stylistId,
        current,
        duration,
        bufferMinutes
      );

      if (!conflict.hasConflict) {
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
};

module.exports = appointmentSchedulingService;
