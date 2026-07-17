const customerService = require("../services/customerService");
const reservationDAO = require("../DAOs/reservation.dao");

const getCustomerHandler = async (req, res) => {
  const { customerId } = req.params;
  const customer = await customerService.getCustomerLoyalty(customerId);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }
  return res.status(200).json({ success: true, customer });
};

const getCustomerProfileHandler = async (req, res) => {
  const { customerId } = req.params;

  const customer = await reservationDAO.getCustomerById(customerId);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }

  const [history, stats] = await Promise.all([
    reservationDAO.getCustomerReservationHistory(customerId, 50),
    reservationDAO.getCustomerStats(customerId),
  ]);

  return res.status(200).json({
    success: true,
    profile: {
      customer,
      history,
      stats,
    },
  });
};

const updateTagsHandler = async (req, res) => {
  const { customerId } = req.params;
  const { tags } = req.body;
  const customer = await customerService.updateCustomerTags(customerId, tags);
  return res.status(200).json({ success: true, customer });
};

const updateCustomerHandler = async (req, res) => {
  const { customerId } = req.params;
  const updates = req.body;
  const customer = await customerService.updateCustomer(customerId, updates);
  return res.status(200).json({ success: true, customer });
};

const findOrCreateHandler = async (req, res) => {
  const customer = await customerService.findOrCreateCustomer(req.body);
  return res.status(200).json({ success: true, customer });
};

const incrementVisitHandler = async (req, res) => {
  const { customerId } = req.params;
  const customer = await customerService.incrementVisit(customerId);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }
  return res.status(200).json({ success: true, customer });
};

const addPointsHandler = async (req, res) => {
  const { customerId } = req.params;
  const { points } = req.body;
  if (!points || Number(points) <= 0) {
    return res.status(400).json({ success: false, message: "Invalid points value." });
  }
  const customer = await customerService.addPoints(customerId, Number(points));
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }
  return res.status(200).json({ success: true, customer });
};

const redeemPointsHandler = async (req, res) => {
  const { customerId } = req.params;
  const { points } = req.body;
  if (!points || Number(points) <= 0) {
    return res.status(400).json({ success: false, message: "Invalid points value." });
  }
  const customer = await customerService.redeemPoints(customerId, Number(points));
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }
  return res.status(200).json({ success: true, customer });
};

const updatePreferencesHandler = async (req, res) => {
  const { customerId } = req.params;
  const preferences = req.body.preferences || {};
  const customer = await customerService.updatePreferences(customerId, preferences);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }
  return res.status(200).json({ success: true, customer });
};

const searchCustomersHandler = async (req, res) => {
  const query = (req.query.q || "").trim();
  if (!query) {
    return res.status(400).json({ success: false, message: "Query is required" });
  }
  const customers = await customerService.searchCustomers(query);
  return res.status(200).json({ success: true, customers });
};

module.exports = {
  getCustomerHandler,
  getCustomerProfileHandler,
  updateTagsHandler,
  findOrCreateHandler,
  incrementVisitHandler,
  addPointsHandler,
  redeemPointsHandler,
  updatePreferencesHandler,
  searchCustomersHandler,
};
