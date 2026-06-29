const reservationDAO = require("../DAOs/reservation.dao");

const getCustomerLoyalty = async (customerId) => {
  return await reservationDAO.getCustomerById(customerId);
};

const updateCustomerTags = async (customerId, tags) => {
  return await reservationDAO.updateCustomerTags(customerId, tags);
};

const findOrCreateCustomer = async (customerDetails) => {
  return await reservationDAO.findOrCreateCustomer(customerDetails);
};

module.exports = {
  getCustomerLoyalty,
  updateCustomerTags,
  findOrCreateCustomer,
};
