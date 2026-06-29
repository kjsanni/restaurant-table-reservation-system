const dateTimeValidator = require("../utils/dateAndTimeValidator");

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

const checkScheduleAvailability = async (scheduleDAO, holidayDAO, resDate, resTime) => {
  const dayName = getDayName(resDate);
  const daySchedule = await scheduleDAO.getScheduleByDay(dayName);
  
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

  const holiday = await holidayDAO.getHolidayByDate(resDate);
  if (holiday && holiday.isClosed) {
    throw {
      status: 400,
      message: `Restaurant is closed on ${resDate} (${holiday.description || "Holiday"})`,
    };
  }

  return { daySchedule, holiday };
};

const getSlotDuration = async (scheduleDAO, holidayDAO, resDate) => {
  const dayName = getDayName(resDate);
  const daySchedule = await scheduleDAO.getScheduleByDay(dayName);
  
  if (daySchedule) {
    const holiday = await holidayDAO.getHolidayByDate(resDate);
    if (holiday && !holiday.isClosed) {
      return holiday.slotDuration || daySchedule.slotDuration;
    }
    return daySchedule.slotDuration;
  }
  
  return 30;
};

const validateReservationTime = async (scheduleDAO, holidayDAO, resDate, resTime) => {
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

  await checkScheduleAvailability(scheduleDAO, holidayDAO, resDate, resTime);
  return true;
};

module.exports = {
  getDayName,
  checkScheduleAvailability,
  getSlotDuration,
  validateReservationTime,
};