const menuService = require("../services/menu.service");

const getCategoriesHandler = async (req, res) => {
  const categories = await menuService.getMenuCategories(req.tenant?.id);
  return res.status(200).json({ success: true, categories });
};

const getMenuItemsHandler = async (req, res) => {
  const filters = {};
  if (req.query.categoryId) filters.categoryId = req.query.categoryId;
  if (req.query.available === "true") filters.isAvailable = true;

  const items = await menuService.getMenuItems(req.tenant?.id, filters);
  return res.status(200).json({ success: true, items });
};

const getAvailableMenuHandler = async (req, res) => {
  const menu = await menuService.getAvailableMenu(req.tenant?.id);
  return res.status(200).json({ success: true, menu });
};

const getMenuItemDetailHandler = async (req, res) => {
  const item = await menuService.getMenuItemDetail(req.params.id, req.tenant?.id);
  if (!item) {
    return res.status(404).json({ success: false, message: "Menu item not found" });
  }
  return res.status(200).json({ success: true, item });
};

module.exports = {
  getCategoriesHandler,
  getMenuItemsHandler,
  getAvailableMenuHandler,
  getMenuItemDetailHandler,
};
