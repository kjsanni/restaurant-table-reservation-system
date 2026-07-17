const waitlistDAO = require("../DAOs/waitlist.dao");

const getAllHandler = async (req, res) => {
  const filters = {};
  if (req.query.desiredTime) filters.desiredTime = req.query.desiredTime;
  if (req.query.customerId) filters.customerId = req.query.customerId;
  const entries = await waitlistDAO.getWaitingList(filters, req.tenant?.id);
  return res.status(200).json({ success: true, entries });
};

const getStatsHandler = async (req, res) => {
  const stats = await waitlistDAO.getStats(req.tenant?.id);
  return res.status(200).json({ success: true, stats });
};

const createHandler = async (req, res) => {
  const { name, partySize, phone, email, desiredTime, notes } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: "Name is required" });
  }
  const entry = await waitlistDAO.createEntry({
    name,
    partySize: partySize || 2,
    phone,
    email,
    desiredTime,
    notes,
    status: "waiting",
  }, req.tenant?.id);
  return res.status(201).json({ success: true, message: "Added to waitlist", entry });
};

const createFromReservationHandler = async (req, res) => {
  const { reservationId } = req.params;
  const entry = await waitlistDAO.createFromReservation(reservationId, req.tenant?.id);
  if (!entry) {
    return res.status(404).json({ success: false, message: "Reservation not found" });
  }
  return res.status(201).json({ success: true, message: "Reservation sent to waitlist", entry });
};

const seatHandler = async (req, res) => {
  const { id } = req.params;
  const entry = await waitlistDAO.markSeated(id, req.tenant?.id);
  if (!entry) {
    return res.status(404).json({ success: false, message: "Waitlist entry not found" });
  }
  return res.status(200).json({ success: true, message: "Guest seated", entry });
};

const cancelHandler = async (req, res) => {
  const { id } = req.params;
  const entry = await waitlistDAO.markCancelled(id, req.tenant?.id);
  if (!entry) {
    return res.status(404).json({ success: false, message: "Waitlist entry not found" });
  }
  return res.status(200).json({ success: true, message: "Waitlist entry cancelled", entry });
};

const deleteHandler = async (req, res) => {
  const { id } = req.params;
  await waitlistDAO.deleteEntry(id, req.tenant?.id);
  return res.status(200).json({ success: true, message: "Waitlist entry deleted" });
};

const expireOldHandler = async (req, res) => {
  const count = await waitlistDAO.expireOldEntries(req.tenant?.id);
  return res.status(200).json({ success: true, message: `Expired ${count} entries`, count });
};

module.exports = {
  getAllHandler,
  getStatsHandler,
  createHandler,
  createFromReservationHandler,
  seatHandler,
  cancelHandler,
  deleteHandler,
  expireOldHandler,
};
