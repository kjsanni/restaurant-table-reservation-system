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

const incrementVisit = async (customerId) => {
  return await reservationDAO.incrementCustomerVisit(customerId);
};

const addPoints = async (customerId, points) => {
  return await reservationDAO.addCustomerPoints(customerId, points);
};

const redeemPoints = async (customerId, points) => {
  return await reservationDAO.redeemCustomerPoints(customerId, points);
};

const updatePreferences = async (customerId, preferences) => {
  return await reservationDAO.updateCustomerPreferences(customerId, preferences);
};

const searchCustomers = async (query) => {
  return await reservationDAO.searchCustomers(query);
};

module.exports = {
  getCustomerLoyalty,
  updateCustomerTags,
  findOrCreateCustomer,
  incrementVisit,
  addPoints,
  redeemPoints,
  updatePreferences,
  searchCustomers,
};
