const { Op } = require("sequelize");
const db = require("../db/models");
const Reservation = db.reservation;
const Holiday = db.holiday;
const Schedule = db.schedule;

const VALID_FREQUENCIES = ["daily", "weekly", "monthly"];

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addWeeks = (date, weeks) => {
  return addDays(date, weeks * 7);
};

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const isSameDay = (d1, d2) => {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
};

const getDayName = (date) => {
  return DAY_NAMES[date.getDay()];
};

const isHoliday = async (date, tenantId) => {
  const dateStr = date.toISOString().split("T")[0];
  const holiday = await Holiday.findOne({
    where: withTenant({ date: dateStr }, tenantId),
  });
  return !!holiday;
};

const isWithinSchedule = async (date, tenantId) => {
  const dayName = getDayName(date);
  const schedule = await Schedule.findOne({
    where: withTenant({ day: dayName, isClosed: false }, tenantId),
  });
  return !!schedule;
};

const matchesByDay = (date, byDay) => {
  if (!byDay || !Array.isArray(byDay) || byDay.length === 0) {
    return true;
  }
  const currentDay = getDayName(date);
  return byDay.includes(currentDay);
};

const expandRecurrence = async (recurrence, from, to, tenantId) => {
  if (!recurrence || !recurrence.frequency || !recurrence.until) {
    return [];
  }

  const frequency = recurrence.frequency.toLowerCase();
  const interval = Number(recurrence.interval) || 1;
  const byDay = recurrence.byDay || [];
  const until = new Date(recurrence.until);
  const startDate = from ? new Date(from) : new Date();
  const endDate = to ? new Date(to) : until;

  if (!VALID_FREQUENCIES.includes(frequency)) {
    throw { status: 400, message: "Invalid recurrence frequency." };
  }

  if (isNaN(until.getTime())) {
    throw { status: 400, message: "Invalid recurrence until date." };
  }

  const occurrences = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate && currentDate <= until) {
    if (matchesByDay(currentDate, byDay)) {
      const isHolidayDate = await isHoliday(currentDate, tenantId);
      const hasSchedule = await isWithinSchedule(currentDate, tenantId);

      if (!isHolidayDate && hasSchedule) {
        occurrences.push(new Date(currentDate));
      }
    }

    if (frequency === "daily") {
      currentDate = addDays(currentDate, interval);
    } else if (frequency === "weekly") {
      currentDate = addWeeks(currentDate, interval);
    } else if (frequency === "monthly") {
      currentDate = addMonths(currentDate, interval);
    }
  }

  return occurrences;
};

const getRecurringReservations = async (customerId, tenantId) => {
  const reservations = await Reservation.findAll({
    where: withTenant({
      customerId,
      recurrence: {
        [Op.not]: null,
      },
    }, tenantId),
    order: [["resDate", "ASC"]],
  });

  return reservations.map((reservation) => {
    const recurrence = reservation.recurrence || {};
    return {
      id: reservation.id,
      resDate: reservation.resDate,
      resTime: reservation.resTime,
      people: reservation.people,
      recurrence: {
        frequency: recurrence.frequency || null,
        interval: recurrence.interval || null,
        until: recurrence.until || null,
        byDay: recurrence.byDay || [],
      },
    };
  });
};

module.exports = {
  VALID_FREQUENCIES,
  expandRecurrence,
  getRecurringReservations,
};
