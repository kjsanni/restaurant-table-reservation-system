const db = require("../db/models");
const { Op } = db.Sequelize;
const MenuCategory = db.menuCategory;
const MenuItem = db.menuItem;
const MenuItemOption = db.menuItemOption;

const withTenant = (where = {}, tenantId) =>
  tenantId ? { ...where, tenantId } : where;

const createCategory = async (tenantId, data) => {
  return await MenuCategory.create({
    ...data,
    ...withTenant({}, tenantId),
  });
};

const updateCategory = async (id, tenantId, data) => {
  const category = await MenuCategory.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!category) return null;
  return await category.update(data);
};

const deleteCategory = async (id, tenantId) => {
  const category = await MenuCategory.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!category) return 0;
  const deleted = await category.destroy();
  return deleted ? 1 : 0;
};

const getCategories = async (tenantId) => {
  return await MenuCategory.findAll({
    where: withTenant({}, tenantId),
    order: [["sortOrder", "ASC"], ["name", "ASC"]],
  });
};

const createMenuItem = async (tenantId, data) => {
  return await MenuItem.create({
    ...data,
    ...withTenant({}, tenantId),
  });
};

const updateMenuItem = async (id, tenantId, data) => {
  const item = await MenuItem.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!item) return null;
  return await item.update(data);
};

const deleteMenuItem = async (id, tenantId) => {
  const item = await MenuItem.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!item) return 0;
  const deleted = await item.destroy();
  return deleted ? 1 : 0;
};

const getMenuItems = async (tenantId, filters = {}) => {
  const where = withTenant({}, tenantId);
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.isAvailable !== undefined) where.isAvailable = filters.isAvailable;

  return await MenuItem.findAll({
    where,
    include: [
      {
        model: MenuCategory,
        attributes: ["id", "name"],
      },
    ],
    order: [["sortOrder", "ASC"], ["name", "ASC"]],
  });
};

const getAvailableMenuItems = async (tenantId) => {
  return await MenuItem.findAll({
    where: withTenant({ isAvailable: true }, tenantId),
    include: [
      {
        model: MenuCategory,
        attributes: ["id", "name", "description"],
      },
      {
        model: MenuItemOption,
        attributes: ["id", "name", "priceAdjustment"],
      },
    ],
    order: [["sortOrder", "ASC"], ["name", "ASC"]],
  });
};

const getMenuItemById = async (id, tenantId) => {
  return await MenuItem.findOne({
    where: withTenant({ id }, tenantId),
    include: [
      {
        model: MenuCategory,
        attributes: ["id", "name"],
      },
      {
        model: MenuItemOption,
        attributes: ["id", "name", "priceAdjustment"],
      },
    ],
  });
};

const createMenuItemOption = async (menuItemId, data) => {
  return await MenuItemOption.create({
    ...data,
    menuItemId,
  });
};

const updateMenuItemOption = async (id, data) => {
  const option = await MenuItemOption.findByPk(id);
  if (!option) return null;
  return await option.update(data);
};

const deleteMenuItemOption = async (id) => {
  const option = await MenuItemOption.findByPk(id);
  if (!option) return 0;
  const deleted = await option.destroy();
  return deleted ? 1 : 0;
};

const getMenuItemOptions = async (menuItemId) => {
  return await MenuItemOption.findAll({
    where: { menuItemId },
    order: [["name", "ASC"]],
  });
};

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItems,
  getAvailableMenuItems,
  getMenuItemById,
  createMenuItemOption,
  updateMenuItemOption,
  deleteMenuItemOption,
  getMenuItemOptions,
};
