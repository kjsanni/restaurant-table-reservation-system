"use strict";
const inventoryItemDao = require("../DAOs/inventoryItem.dao");
const { createCrudHandlers } = require("./base.controller");

const inventoryItemHandlers = createCrudHandlers(inventoryItemDao, "InventoryItem", {
  displayName: "Inventory item",
});

const getLowStockHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const items = await inventoryItemDao.findLowStock(tenantId);
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getLowStockHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load low stock alerts" });
  }
};

module.exports = {
  ...inventoryItemHandlers,
  getLowStockHandler,
};
