const customerService = require("../services/customerService");

const getCustomerHandler = async (req, res) => {
  const { customerId } = req.params;
  const customer = await customerService.getCustomerLoyalty(customerId);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }
  return res.status(200).json({ success: true, customer });
};

const updateTagsHandler = async (req, res) => {
  const { customerId } = req.params;
  const { tags } = req.body;
  const customer = await customerService.updateCustomerTags(customerId, tags);
  return res.status(200).json({ success: true, customer });
};

const findOrCreateHandler = async (req, res) => {
  const customer = await customerService.findOrCreateCustomer(req.body);
  return res.status(200).json({ success: true, customer });
};

module.exports = {
  getCustomerHandler,
  updateTagsHandler,
  findOrCreateHandler,
};
