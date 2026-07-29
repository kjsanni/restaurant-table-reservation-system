"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { protect, requireActiveTenant } = require("../../../middleware/auth");

const checkErpnextHr = async (req, res, next) => {
  const tenant = req.tenant;
  if (!tenant) {
    return res.status(400).json({ success: false, message: "Tenant context required" });
  }
  const flags = tenant.settings?.featureFlags || {};
  if (!flags.erpnext_hr) {
    return res.status(403).json({ success: false, message: "ERPNext HR is not enabled for this tenant" });
  }
  next();
};

router.get("/employees", tryCatchHandler(requireActiveTenant, checkErpnextHr, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { search, page = 1, pageSize = 20 } = req.query;
  const filters = { company: tenant.name };
  if (search) filters.name = ["like", `%${search}%`];
  try {
    const result = await getClient().get("/api/resource/Employee", {
      params: { filters, page, page_length: parseInt(pageSize, 10) },
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.get("/employees/:employeeId", tryCatchHandler(requireActiveTenant, checkErpnextHr, async (req, res) => {
  const tenant = req.tenant;
  const { employeeId } = req.params;
  const { getClient } = require("../client");
  try {
    const result = await getClient().get(`/api/resource/Employee/${employeeId}`);
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.post("/sync/employees", tryCatchHandler(requireActiveTenant, checkErpnextHr, async (req, res) => {
  const tenant = req.tenant;
  const { staffIds } = req.body;
  const { syncEmployee, syncAllEmployees } = require("../sync/employee.sync");
  try {
    if (staffIds && staffIds.length > 0) {
      const results = [];
      for (const staffId of staffIds) {
        const result = await syncEmployee(tenant.id, staffId);
        results.push(result);
      }
      res.status(200).json({ success: true, results });
    } else {
      const results = await syncAllEmployees(tenant.id);
      res.status(200).json({ success: true, results });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

module.exports = router;