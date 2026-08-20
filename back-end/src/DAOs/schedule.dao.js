const db = require("../db/models");
const Schedule = db.schedule;
const Holiday = db.holiday;
const { tenantCache } = require("../utils/tenantCache");

const withTenant = (where = {}, tenantId) => {
  if (!tenantId) {
    console.warn(`[tenant-scoping] ${require("path").basename(module.filename)}: withTenant called without tenantId — tenant filter dropped`);
  }
  return tenantId ? { ...where, tenantId } : where;
};

const createSchedule = async (scheduleData, tenantId) => {
  await tenantCache.del(tenantId || "global", "schedules:all");
  return await Schedule.create({ ...scheduleData, ...withTenant({}, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
};

const getAllSchedules = async (tenantId) => {
  const cached = await tenantCache.get(tenantId || "global", "schedules:all");
  if (cached) return cached;

  const schedules = await Schedule.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({}, tenantId),
    order: [["dayOfWeek", "ASC"]],
  });
  await tenantCache.set(tenantId || "global", "schedules:all", schedules, 300);
  return schedules;
};

const getScheduleByDay = async (dayOfWeek, tenantId) => {
  const cached = await tenantCache.get(tenantId || "global", `schedule:${dayOfWeek}`);
  if (cached) return cached;

// codacy-suppress NoSqlInjection
  let schedule = await Schedule.findOne({ where: withTenant({ dayOfWeek }, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
  if (!schedule && tenantId) {
    schedule = await Schedule.findOne({ where: { dayOfWeek, tenantId: null } }); // codacy-suppress nosql-injection - parameterized ORM call
    if (schedule) {
      console.warn(`Schedule fallback: tenant ${tenantId} missing schedule for ${dayOfWeek}, using global schedule`);
    }
  }
  if (schedule) await tenantCache.set(tenantId || "global", `schedule:${dayOfWeek}`, schedule, 300);
  return schedule;
};

const updateSchedule = async (id, scheduleData, tenantId) => {
  const schedule = await Schedule.findOne({ where: withTenant({ id }, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
  if (!schedule) return null;

  await tenantCache.del(tenantId || "global", "schedules:all");
  await tenantCache.del(tenantId || "global", `schedule:${schedule.dayOfWeek}`);
  return await schedule.update(scheduleData); // codacy-suppress nosql-injection - parameterized ORM call
};

const deleteSchedule = async (id, tenantId) => {
  const schedule = await Schedule.findOne({ where: withTenant({ id }, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
  if (!schedule) return null;

  await tenantCache.del(tenantId || "global", "schedules:all");
  await tenantCache.del(tenantId || "global", `schedule:${schedule.dayOfWeek}`);
  return await schedule.destroy();
};

const createHoliday = async (holidayData, tenantId) => {
  await tenantCache.del(tenantId || "global", "holidays:all");
  return await Holiday.create({ ...holidayData, ...withTenant({}, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
};

const getAllHolidays = async (tenantId) => {
  const cached = await tenantCache.get(tenantId || "global", "holidays:all");
  if (cached) return cached;

  const holidays = await Holiday.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({}, tenantId),
    order: [["date", "ASC"]],
  });
  await tenantCache.set(tenantId || "global", "holidays:all", holidays, 300);
  return holidays;
};

const getHolidayByDate = async (date, tenantId) => {
  const cached = await tenantCache.get(tenantId || "global", `holiday:${date}`);
  if (cached && cached.date === date) return cached;

  const holiday = await Holiday.findOne({ where: withTenant({ date }, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
  if (holiday) await tenantCache.set(tenantId || "global", `holiday:${date}`, holiday, 300);
  else await tenantCache.set(tenantId || "global", `holiday:${date}`, null, 60);
  return holiday;
};

const deleteHoliday = async (id, tenantId) => {
  const holiday = await Holiday.findOne({ where: withTenant({ id }, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
  if (!holiday) return null;

  await tenantCache.del(tenantId || "global", "holidays:all");
  await tenantCache.del(tenantId || "global", `holiday:${holiday.date}`);
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
