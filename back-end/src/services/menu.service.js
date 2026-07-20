const menuDAO = require("../DAOs/menu.dao");

const getMenuCategories = async (tenantId) => {
  return await menuDAO.getCategories(tenantId);
};

const getMenuItems = async (tenantId, filters = {}) => {
  return await menuDAO.getMenuItems(tenantId, filters);
};

const getAvailableMenu = async (tenantId) => {
  return await menuDAO.getAvailableMenuItems(tenantId);
};

const getMenuItemDetail = async (id, tenantId) => {
  return await menuDAO.getMenuItemById(id, tenantId);
};

module.exports = {
  getMenuCategories,
  getMenuItems,
  getAvailableMenu,
  getMenuItemDetail,
};
