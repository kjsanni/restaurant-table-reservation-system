const dateTimeValidator = require("../utils/dateAndTimeValidator");
const authDAO = require("../DAOs/auth.dao");

const getDayName = (date) => {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[new Date(date).getDay()];
};

const toMinutes = (time) => {
  if (!time || typeof time !== "string") return null;
  const parts = time.split(":").map(Number);
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
  return parts[0] * 60 + parts[1];
};

const checkBusinessHours = async (resDate, resTime, tenantId) => {
  const config = await authDAO.getSettingValue(
    "business_hours",
    { enabled: false, days: {} },
    tenantId
  );
  if (!config || !config.enabled) return;
  const dayName = getDayName(resDate);
  const day = config.days && config.days[dayName];
  if (!day) return;
  if (day.closed) {
    throw { status: 400, message: `Restaurant is closed on ${dayName}s (business hours).` };
  }
  const start = toMinutes(day.open);
  const end = toMinutes(day.close);
  const at = toMinutes(resTime);
  if (start === null || end === null || at === null) return;
  if (at < start || at >= end) {
    throw {
      status: 400,
      message: `Reservations are only accepted between ${day.open} and ${day.close} on ${dayName}s.`,
    };
  }
};

const checkScheduleAvailability = async (scheduleDAO, holidayDAO, resDate, resTime, tenantId) => {
  const dayName = getDayName(resDate);
  const daySchedule = await scheduleDAO.getScheduleByDay(dayName, tenantId);
  
  if (!daySchedule) {
    throw {
      status: 400,
      message: `No schedule configured for ${dayName}`,
    };
  }

  if (daySchedule.isClosed) {
    throw {
      status: 400,
      message: `Restaurant is closed on ${dayName}s`,
    };
  }

  const holiday = await holidayDAO.getHolidayByDate(resDate, tenantId);
  if (holiday && holiday.isClosed) {
    throw {
      status: 400,
      message: `Restaurant is closed on ${resDate} (${holiday.description || "Holiday"})`,
    };
  }

  return { daySchedule, holiday };
};

const getSlotDuration = async (scheduleDAO, holidayDAO, resDate, tenantId) => {
  const dayName = getDayName(resDate);
  const daySchedule = await scheduleDAO.getScheduleByDay(dayName, tenantId);
  
  if (daySchedule) {
    const holiday = await holidayDAO.getHolidayByDate(resDate, tenantId);
    if (holiday && !holiday.isClosed) {
      return holiday.slotDuration || daySchedule.slotDuration;
    }
    return daySchedule.slotDuration;
  }
  
  return 30;
};

const validateReservationTime = async (scheduleDAO, holidayDAO, resDate, resTime, tenantId) => {
  const now = new Date();
  const currDateStr = dateTimeValidator.asDateString(now);
  const currTimeStr = dateTimeValidator.asTimeString(now);

  if (resDate < currDateStr) {
    throw {
      status: 400,
      message: "Cannot make reservation in the past!",
    };
  }

  if (resDate === currDateStr && resTime < currTimeStr) {
    throw {
      status: 400,
      message: "Cannot make reservation in the past!",
    };
  }

  await checkScheduleAvailability(scheduleDAO, holidayDAO, resDate, resTime, tenantId);
  return true;
};

module.exports = {
  getDayName,
  checkBusinessHours,
  checkScheduleAvailability,
  getSlotDuration,
  validateReservationTime,
};