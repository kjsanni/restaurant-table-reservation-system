"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { protect, requireActiveTenant } = require("../../../middleware/auth");

const checkErpnextManufacturing = async (req, res, next) => {
  const tenant = req.tenant;
  if (!tenant) {
    return res.status(400).json({ success: false, message: "Tenant context required" });
  }
  const flags = tenant.settings?.featureFlags || {};
  if (!flags.erpnext_manufacturing) {
    return res.status(403).json({ success: false, message: "ERPNext Manufacturing is not enabled for this tenant" });
  }
  next();
};

router.get("/boms", tryCatchHandler(requireActiveTenant, checkErpnextManufacturing, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { search, page = 1, pageSize = 20 } = req.query;
  const filters = { company: tenant.name };
  if (search) filters.name = ["like", `%${search}%`];
  try {
    const result = await getClient().get("/api/resource/BOM", {
      params: { filters, page, page_length: parseInt(pageSize, 10) },
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.get("/boms/:bomId", tryCatchHandler(requireActiveTenant, checkErpnextManufacturing, async (req, res) => {
  const tenant = req.tenant;
  const { bomId } = req.params;
  const { getClient } = require("../client");
  try {
    const result = await getClient().get(`/api/resource/BOM/${bomId}`);
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.get("/production-plans", tryCatchHandler(requireActiveTenant, checkErpnextManufacturing, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { status, from, to, page = 1, pageSize = 20 } = req.query;
  const filters = { company: tenant.name };
  if (status) filters.status = status;
  if (from) filters.from_date = from;
  if (to) filters.to_date = to;
  try {
    const result = await getClient().get("/api/resource/Production Plan", {
      params: { filters, page, page_length: parseInt(pageSize, 10) },
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

module.exports = router;
