"use strict";

const inventoryItemDao = require("../DAOs/inventoryItem.dao");

const createInventoryItemHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const data = req.body;
    const item = await inventoryItemDao.create(data, tenantId);
    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    console.error("createInventoryItemHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to create inventory item" });
  }
};

const getInventoryItemsHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { category, search } = req.query;
    const items = await inventoryItemDao.findAll(tenantId, { category, search });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getInventoryItemsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load inventory items" });
  }
};

const getInventoryItemHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const item = await inventoryItemDao.findById(id, tenantId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Inventory item not found" });
    }
    return res.status(200).json({ success: true, data: item });
  } catch (err) {
    console.error("getInventoryItemHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load inventory item" });
  }
};

const updateInventoryItemHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const updated = await inventoryItemDao.update(id, tenantId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Inventory item not found" });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("updateInventoryItemHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update inventory item" });
  }
};

const deleteInventoryItemHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const removed = await inventoryItemDao.delete(id, tenantId);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Inventory item not found" });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("deleteInventoryItemHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete inventory item" });
  }
};

module.exports = {
  createInventoryItemHandler,
  getInventoryItemsHandler,
  getInventoryItemHandler,
  updateInventoryItemHandler,
  deleteInventoryItemHandler,
};
