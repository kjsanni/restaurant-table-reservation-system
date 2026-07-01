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

module.exports = {
  getCustomerHandler,
  getCustomerProfileHandler,
  updateTagsHandler,
  findOrCreateHandler,
};