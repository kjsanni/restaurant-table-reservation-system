const db = require("../db/models");
const Schedule = db.schedule;
const Holiday = db.holiday;
const { cache } = require("../utils/cache");

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : {});

const createSchedule = async (scheduleData, tenantId) => {
  await cache.del("schedules:all");
  return await Schedule.create({ ...scheduleData, ...withTenant({}, tenantId) });
};

const getAllSchedules = async (tenantId) => {
  const cached = await cache.get("schedules:all");
  if (cached) return cached;

  const schedules = await Schedule.findAll({
    where: withTenant({}, tenantId),
    order: [["dayOfWeek", "ASC"]],
  });
  await cache.set("schedules:all", schedules, 300);
  return schedules;
};

const getScheduleByDay = async (dayOfWeek, tenantId) => {
  const cached = await cache.get(`schedule:${dayOfWeek}`);
  if (cached) return cached;

  const schedule = await Schedule.findOne({ where: withTenant({ dayOfWeek }, tenantId) });
  if (schedule) await cache.set(`schedule:${dayOfWeek}`, schedule, 300);
  return schedule;
};

const updateSchedule = async (id, scheduleData, tenantId) => {
  const schedule = await Schedule.findOne({ where: withTenant({ id }, tenantId) });
  if (!schedule) return null;

  await cache.del("schedules:all");
  await cache.del(`schedule:${schedule.dayOfWeek}`);
  return await schedule.update(scheduleData);
};

const deleteSchedule = async (id, tenantId) => {
  const schedule = await Schedule.findOne({ where: withTenant({ id }, tenantId) });
  if (!schedule) return null;

  await cache.del("schedules:all");
  await cache.del(`schedule:${schedule.dayOfWeek}`);
  return await schedule.destroy();
};

const createHoliday = async (holidayData, tenantId) => {
  await cache.del("holidays:all");
  return await Holiday.create({ ...holidayData, ...withTenant({}, tenantId) });
};

const getAllHolidays = async (tenantId) => {
  const cached = await cache.get("holidays:all");
  if (cached) return cached;

  const holidays = await Holiday.findAll({
    where: withTenant({}, tenantId),
    order: [["date", "ASC"]],
  });
  await cache.set("holidays:all", holidays, 300);
  return holidays;
};

const getHolidayByDate = async (date, tenantId) => {
  const cached = await cache.get(`holiday:${date}`);
  if (cached) return cached;

  const holiday = await Holiday.findOne({ where: withTenant({ date }, tenantId) });
  if (holiday) await cache.set(`holiday:${date}`, holiday, 300);
  return holiday;
};

const deleteHoliday = async (id, tenantId) => {
  const holiday = await Holiday.findOne({ where: withTenant({ id }, tenantId) });
  if (!holiday) return null;

  await cache.del("holidays:all");
  await cache.del(`holiday:${holiday.date}`);
  return await holiday.destroy();
};

module.exports = {
  createSchedule,
  getAllSchedules,
  getScheduleByDay,
  updateSchedule,
  deleteSchedule,
  createHoliday,
  getAllHolidays,
  getHolidayByDate,
  deleteHoliday,
};
