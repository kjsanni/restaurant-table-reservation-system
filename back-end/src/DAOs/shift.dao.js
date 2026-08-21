const db = require("../db/models");
const StaffShift = db.staffShift;
const User = db.user;
const { tenantCache } = require("../utils/tenantCache");

const withTenant = (where = {}, tenantId) => {
  if (!tenantId) {
    console.warn(`[tenant-scoping] ${require("path").basename(module.filename)}: withTenant called without tenantId — tenant filter dropped`);
  }
  return tenantId ? { ...where, tenantId } : where;
};

const createShift = async ({ userId, dayOfWeek, startTime, endTime, role, locationId }, tenantId) => {
  const shift = await StaffShift.create({ userId, dayOfWeek, startTime, endTime, role, locationId, ...withTenant({}, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
  await tenantCache.del(tenantId || "global", `shifts:day:${dayOfWeek || "all"}:location:${locationId || "all"}`);
  await tenantCache.del(tenantId || "global", `staff:all:location:${locationId || "all"}`);
  return shift;
};

const getShiftsByDay = async (dayOfWeek, tenantId, locationId) => {
  const cacheKey = `shifts:day:${dayOfWeek || "all"}:location:${locationId || "all"}`;
  const cached = await tenantCache.get(tenantId || "global", cacheKey);
  if (cached) return cached;
  const where = withTenant(dayOfWeek ? { dayOfWeek } : {}, tenantId);
  if (locationId) where.locationId = locationId;
  const shifts = await StaffShift.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    include: [
      { model: User, attributes: ["id", "username", "role"] },
      { model: db.location, as: "location", attributes: ["id", "name"] },
    ],
    order: [["startTime", "ASC"]],
  });
  await tenantCache.set(tenantId || "global", cacheKey, shifts, 300);
  return shifts;
};

const deleteShift = async (id, tenantId) => {
// codacy-suppress NoSqlInjection
  const shift = await StaffShift.findOne({ where: withTenant({ id }, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
  if (!shift) throw { status: 404, message: "Shift not found!" };
  await shift.destroy();
  await tenantCache.del(tenantId || "global", `shifts:day:${shift.dayOfWeek || "all"}:location:${shift.locationId || "all"}`);
  await tenantCache.del(tenantId || "global", `staff:all:location:${shift.locationId || "all"}`);
  return { id };
};

const getAllStaff = async (tenantId, locationId) => {
  const cacheKey = `staff:all:location:${locationId || "all"}`;
  const cached = await tenantCache.get(tenantId || "global", cacheKey);
  if (cached) return cached;
  const where = withTenant({ role: "staff" }, tenantId);
  if (locationId) where.locationId = locationId;
  const staff = await User.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    include: [{ model: db.staffShift, as: "shifts", attributes: ["id", "dayOfWeek", "startTime", "endTime"] }],
    attributes: ["id", "username", "role"],
    order: [["username", "ASC"]],
  });
  await tenantCache.set(tenantId || "global", cacheKey, staff, 300);
  return staff;
};

module.exports = {
  createShift,
  getShiftsByDay,
  deleteShift,
  getAllStaff,
};
