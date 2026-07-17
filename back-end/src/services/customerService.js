const reservationDAO = require("../DAOs/reservation.dao");

const getCustomerLoyalty = async (customerId, tenantId) => {
  return await reservationDAO.getCustomerById(customerId, tenantId);
};

const updateCustomerTags = async (customerId, tags, tenantId) => {
  return await reservationDAO.updateCustomerTags(customerId, tags, tenantId);
};

const updateCustomer = async (customerId, updates, tenantId) => {
  const allowedFields = ["firstName", "lastName", "email", "phone", "address", "city", "notes"];
  const filteredUpdates = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }
  return await reservationDAO.updateCustomer(customerId, filteredUpdates, tenantId);
};

const findOrCreateCustomer = async (customerDetails, tenantId) => {
  return await reservationDAO.findOrCreateCustomer(customerDetails, null, tenantId);
};

const incrementVisit = async (customerId, tenantId) => {
  return await reservationDAO.incrementCustomerVisit(customerId, tenantId);
};

const addPoints = async (customerId, points, tenantId) => {
  return await reservationDAO.addCustomerPoints(customerId, points, tenantId);
};

const redeemPoints = async (customerId, points, tenantId) => {
  return await reservationDAO.redeemCustomerPoints(customerId, points, tenantId);
};

const updatePreferences = async (customerId, preferences, tenantId) => {
  return await reservationDAO.updateCustomerPreferences(customerId, preferences, tenantId);
};

const searchCustomers = async (query, tenantId) => {
  return await reservationDAO.searchCustomers(query, tenantId);
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
