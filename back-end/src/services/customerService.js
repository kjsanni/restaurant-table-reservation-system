const reservationDAO = require("../DAOs/reservation.dao");

const getCustomerLoyalty = async (customerId) => {
  return await reservationDAO.getCustomerById(customerId);
};

const updateCustomerTags = async (customerId, tags) => {
  return await reservationDAO.updateCustomerTags(customerId, tags);
};

const updateCustomer = async (customerId, updates) => {
  const allowedFields = ["firstName", "lastName", "email", "phone", "address", "city", "notes"];
  const filteredUpdates = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }
  return await reservationDAO.updateCustomer(customerId, filteredUpdates);
};

const findOrCreateCustomer = async (customerDetails) => {
  return await reservationDAO.findOrCreateCustomer(customerDetails);
};

module.exports = {
  getCustomerLoyalty,
  updateCustomerTags,
  findOrCreateCustomer,
};
