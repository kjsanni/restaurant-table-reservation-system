"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { requireActiveTenant } = require("../../../middleware/auth");

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

router.get("/crm/customers", tryCatchHandler(requireActiveTenant, checkErpnextCrm, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { search, page = 1, pageSize = 20 } = req.query;
  const filters = { company: tenant.name };
  if (search) filters.customer_name = ["like", `%${search}%`];
  try {
    const result = await (await getClient()).get("/api/resource/Customer", {
      params: { filters, page, page_length: parseInt(pageSize, 10) },
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.get("/crm/leads", tryCatchHandler(requireActiveTenant, checkErpnextCrm, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { search, page = 1, pageSize = 20 } = req.query;
  const filters = { company: tenant.name };
  if (search) filters.lead_name = ["like", `%${search}%`];
  try {
    const result = await (await getClient()).get("/api/resource/Lead", {
      params: { filters, page, page_length: parseInt(pageSize, 10) },
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.get("/crm/campaigns", tryCatchHandler(requireActiveTenant, checkErpnextCrm, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { search, page = 1, pageSize = 20 } = req.query;
  const filters = { company: tenant.name };
  if (search) filters.name = ["like", `%${search}%`];
  try {
    const result = await (await getClient()).get("/api/resource/Campaign", {
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
    const result = await (await getClient()).get("/api/resource/Opportunity", {
      params: { filters, page, page_length: parseInt(pageSize, 10) },
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.post("/crm/sync/leads", tryCatchHandler(requireActiveTenant, checkErpnextCrm, async (req, res) => {
  const tenant = req.tenant;
  const { customerIds } = req.body;
  const { syncCrmLead, syncAllCrmLeads } = require("../sync/employee.sync");
  try {
    if (customerIds && customerIds.length > 0) {
      const results = [];
      for (const customerId of customerIds) {
        const result = await syncCrmLead(tenant.id, customerId);
        results.push(result);
      }
      res.status(200).json({ success: true, results });
    } else {
      const results = await syncAllCrmLeads(tenant.id);
      res.status(200).json({ success: true, results });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.post("/crm/sync/customers", tryCatchHandler(requireActiveTenant, checkErpnextCrm, async (req, res) => {
  const tenant = req.tenant;
  const { customerIds } = req.body;
  const { syncCrmCustomer, syncAllCrmCustomers } = require("../sync/crm.sync");
  try {
    if (customerIds && customerIds.length > 0) {
      const results = [];
      for (const customerId of customerIds) {
        const result = await syncCrmCustomer(tenant.id, customerId);
        results.push(result);
      }
      res.status(200).json({ success: true, results });
    } else {
      const results = await syncAllCrmCustomers(tenant.id);
      res.status(200).json({ success: true, results });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

module.exports = router;