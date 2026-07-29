"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const { protect, requireActiveTenant } = require("../../middleware/auth");

const checkErpnextCrm = async (req, res, next) => {
  const tenant = req.tenant;
  if (!tenant) {
    return res.status(400).json({ success: false, message: "Tenant context required" });
  }
  const flags = tenant.settings?.featureFlags || {};
  if (!flags.erpnext_crm) {
    return res.status(403).json({ success: false, message: "ERPNext CRM is not enabled for this tenant" });
  }
  next();
};

router.get("/crm/campaigns", tryCatchHandler(requireActiveTenant, checkErpnextCrm, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { search, page = 1, pageSize = 20 } = req.query;
  const filters = { company: tenant.name };
  if (search) filters.name = ["like", `%${search}%`];
  try {
    const result = await getClient().get("/api/resource/Campaign", {
      params: { filters, page, page_length: parseInt(pageSize, 10) },
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.get("/crm/opportunities", tryCatchHandler(requireActiveTenant, checkErpnextCrm, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { search, page = 1, pageSize = 20 } = req.query;
  const filters = { company: tenant.name };
  if (search) filters.party_name = ["like", `%${search}%`];
  try {
    const result = await getClient().get("/api/resource/Opportunity", {
      params: { filters, page, page_length: parseInt(pageSize, 10) },
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

module.exports = router;