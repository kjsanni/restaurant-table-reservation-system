"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const { protect, requireActiveTenant } = require("../../middleware/auth");

const checkErpnextStock = async (req, res, next) => {
  const tenant = req.tenant;
  if (!tenant) {
    return res.status(400).json({ success: false, message: "Tenant context required" });
  }
  const flags = tenant.settings?.featureFlags || {};
  if (!flags.erpnext_stock) {
    return res.status(403).json({ success: false, message: "ERPNext Inventory is not enabled for this tenant" });
  }
  next();
};

router.get("/items", tryCatchHandler(requireActiveTenant, checkErpnextStock, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { search, page = 1, pageSize = 20 } = req.query;
  const filters = { company: tenant.name };
  if (search) filters.name = ["like", `%${search}%`];
  try {
    const result = await getClient().get("/api/resource/Item", {
      params: { filters, page, page_length: parseInt(pageSize, 10) },
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.get("/stock", tryCatchHandler(requireActiveTenant, checkErpnextStock, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { itemCode, warehouse, page = 1, pageSize = 20 } = req.query;
  const filters = { company: tenant.name };
  if (itemCode) filters.item_code = itemCode;
  if (warehouse) filters.warehouse = warehouse;
  try {
    const result = await getClient().get("/api/resource/Stock Ledger Entry", {
      params: { filters, page, page_length: parseInt(pageSize, 10) },
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.get("/warehouses", tryCatchHandler(requireActiveTenant, checkErpnextStock, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  try {
    const result = await getClient().get("/api/resource/Warehouse", {
      params: { filters: { company: tenant.name } },
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.post("/sync/items", tryCatchHandler(requireActiveTenant, checkErpnextStock, async (req, res) => {
  const tenant = req.tenant;
  const { itemIds } = req.body;
  const { syncItem, syncAllItems } = require("../sync/item.sync");
  try {
    if (itemIds && itemIds.length > 0) {
      const results = [];
      for (const itemId of itemIds) {
        const result = await syncItem(tenant.id, itemId);
        results.push(result);
      }
      res.status(200).json({ success: true, results });
    } else {
      const results = await syncAllItems(tenant.id);
      res.status(200).json({ success: true, results });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.post("/sync/stock-entries", tryCatchHandler(requireActiveTenant, checkErpnextStock, async (req, res) => {
  const tenant = req.tenant;
  const { syncStockAdjustments } = require("../sync/stock-entry.sync");
  try {
    const results = await syncStockAdjustments(tenant.id);
    res.status(200).json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

module.exports = router;