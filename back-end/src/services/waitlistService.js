const waitlistDAO = require("../DAOs/waitlist.dao");

const getAll = async (filters = {}) => {
  return await waitlistDAO.getWaitingList(filters);
};

const getStats = async () => {
  return await waitlistDAO.getStats();
};

const addToWaitlist = async (data) => {
  if (!data.name) {
    throw { status: 400, message: "Name is required" };
  }
  return await waitlistDAO.createEntry({
    ...data,
    status: "waiting",
  });
};

const seatGuest = async (id) => {
  const entry = await waitlistDAO.markSeated(id);
  if (!entry) throw { status: 404, message: "Waitlist entry not found" };
  return entry;
};

const cancelEntry = async (id) => {
  const entry = await waitlistDAO.markCancelled(id);
  if (!entry) throw { status: 404, message: "Waitlist entry not found" };
  return entry;
};

const removeEntry = async (id) => {
  await waitlistDAO.deleteEntry(id);
  return true;
};

const expireOld = async () => {
  return await waitlistDAO.expireOldEntries();
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
