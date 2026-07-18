const waitlistDAO = require("../DAOs/waitlist.dao");

const getAll = async (filters = {}, tenantId) => {
  return await waitlistDAO.getWaitingList(filters, tenantId);
};

const getStats = async (tenantId) => {
  return await waitlistDAO.getStats(tenantId);
};

const addToWaitlist = async (data, tenantId) => {
  if (!data.name) {
    throw { status: 400, message: "Name is required" };
  }
  return await waitlistDAO.createEntry({
    ...data,
    status: "waiting",
  }, tenantId);
};

const seatGuest = async (id, tenantId) => {
  const entry = await waitlistDAO.markSeated(id, tenantId);
  if (!entry) throw { status: 404, message: "Waitlist entry not found" };
  return entry;
};

const cancelEntry = async (id, tenantId) => {
  const entry = await waitlistDAO.markCancelled(id, tenantId);
  if (!entry) throw { status: 404, message: "Waitlist entry not found" };
  return entry;
};

const removeEntry = async (id, tenantId) => {
  await waitlistDAO.deleteEntry(id, tenantId);
  return true;
};

const expireOld = async (tenantId) => {
  return await waitlistDAO.expireOldEntries(tenantId);
};

module.exports = {
  getAll,
  getStats,
  addToWaitlist,
  seatGuest,
  cancelEntry,
  removeEntry,
  expireOld,
};
