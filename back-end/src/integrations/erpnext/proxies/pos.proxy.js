"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { requireActiveTenant } = require("../../../middleware/auth");

const checkErpnextPos = async (req, res, next) => {
  const tenant = req.tenant;
  if (!tenant) {
    return res.status(400).json({ success: false, message: "Tenant context required" });
  }
  const flags = tenant.settings?.featureFlags || {};
  if (!flags.erpnext_pos) {
    return res.status(403).json({ success: false, message: "ERPNext POS is not enabled for this tenant" });
  }
  next();
};

router.get("/pos/proxy", tryCatchHandler(requireActiveTenant, checkErpnextPos, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { path, method = "GET", ...rest } = req.query;

  if (!path) {
    return res.status(400).json({ success: false, message: "path query parameter is required" });
  }

  try {
    const client = await getClient();
    const params = { method: String(method).toUpperCase() };

    if (method === "GET") {
      params.url = String(path);
      if (Object.keys(rest).length > 0) {
        params.params = rest;
      }
    } else {
      params.url = String(path);
      params.data = rest;
    }

    const result = await client.request(params);
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.post("/pos/sync", tryCatchHandler(requireActiveTenant, checkErpnextPos, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { syncType, payload } = req.body;

  if (!syncType) {
    return res.status(400).json({ success: false, message: "syncType is required" });
  }

  try {
    const client = await getClient();
    let result;

    switch (syncType) {
      case "invoice":
        result = await client.post("/api/resource/Sales Invoice", payload);
        break;
      case "payment":
        result = await client.post("/api/resource/Payment Entry", payload);
        break;
      case "item":
        result = await client.post("/api/resource/Item", payload);
        break;
      case "customer":
        result = await client.post("/api/resource/Customer", payload);
        break;
      default:
        return res.status(400).json({ success: false, message: `Unsupported syncType: ${syncType}` });
    }

    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.get("/pos/sync/status", tryCatchHandler(requireActiveTenant, checkErpnextPos, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");

  try {
    const client = await getClient();
    const result = await client.get("/api/resource/Integration Request", {
      params: { filters: { reference_doctype: "Sales Invoice" }, limit_page_length: 20 },
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

module.exports = router;
