"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { requireActiveTenant } = require("../../../middleware/auth");
const db = require("../../../db/models");

const checkErpnextOnboarding = async (req, res, next) => {
  const tenant = req.tenant;
  if (!tenant) {
    return res.status(400).json({ success: false, message: "Tenant context required" });
  }
  const flags = tenant.settings?.featureFlags || {};
  const hasErpnext = Object.keys(flags).some((k) => k.startsWith("erpnext_") && flags[k]);
  if (!hasErpnext) {
    return res.status(403).json({ success: false, message: "No ERPNext modules enabled for this tenant" });
  }
  next();
};

router.post("/onboarding/company", tryCatchHandler(requireActiveTenant, checkErpnextOnboarding, async (req, res) => {
  const tenant = req.tenant;
  const { companyName, currency, fiscalYearStart } = req.body;
  const { getClient } = require("../client");

  const payload = {
    company_name: companyName || tenant.name,
    default_currency: currency || tenant.currency || "GHS",
    country: "Ghana",
    create_chart_of_accounts_based_on: "Standard Template",
    fiscal_year_start: fiscalYearStart || new Date().toISOString().split("T")[0],
    bank_account: "",
    stock_account: "",
    cost_center: "",
  };

  try {
    const result = await (await getClient()).post("/api/resource/Company", payload);
    const company = result.data.data;

    await db.tenant.update(
      { settings: { ...tenant.settings, erpnextOnboardingStatus: { ...(tenant.settings?.erpnextOnboardingStatus || {}), company: "completed" } } },
      { where: { id: tenant.id } }
    );

    res.status(201).json({ success: true, data: company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.post("/onboarding/warehouse", tryCatchHandler(requireActiveTenant, checkErpnextOnboarding, async (req, res) => {
  const tenant = req.tenant;
  const { warehouseName, address } = req.body;
  const { getClient } = require("../client");

  const payload = {
    warehouse_name: warehouseName || `${tenant.name} Warehouse`,
    company: tenant.name,
    address: address || "",
    is_group: false,
  };

  try {
    const result = await (await getClient()).post("/api/resource/Warehouse", payload);
    const warehouse = result.data.data;

    await db.tenant.update(
      { settings: { ...tenant.settings, erpnextOnboardingStatus: { ...(tenant.settings?.erpnextOnboardingStatus || {}), warehouse: "completed" } } },
      { where: { id: tenant.id } }
    );

    res.status(201).json({ success: true, data: warehouse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.post("/onboarding/employee-import", tryCatchHandler(requireActiveTenant, checkErpnextOnboarding, async (req, res) => {
  const tenant = req.tenant;
  const { employeeMappings } = req.body;
  const { getClient } = require("../client");

  if (!employeeMappings || !Array.isArray(employeeMappings)) {
    return res.status(400).json({ success: false, message: "employeeMappings array is required" });
  }

  const results = [];
  for (const mapping of employeeMappings) {
    try {
      const payload = {
        first_name: mapping.firstName || "",
        last_name: mapping.lastName || "",
        employee_name: `${mapping.firstName || ""} ${mapping.lastName || ""}`.trim(),
        company: tenant.name,
        department: mapping.department || "",
        designation: mapping.designation || "",
        status: "Active",
      };
      const result = await (await getClient()).post("/api/resource/Employee", payload);
      results.push({ staffId: mapping.staffId, status: "success", erpnextName: result.data.data.name });
    } catch (err) {
      results.push({ staffId: mapping.staffId, status: "failed", error: err.message });
    }
  }

  await db.tenant.update(
    { settings: { ...tenant.settings, erpnextOnboardingStatus: { ...(tenant.settings?.erpnextOnboardingStatus || {}), employees: "completed" } } },
    { where: { id: tenant.id } }
  );

  res.status(200).json({ success: true, results });
}));

router.get("/onboarding/status", tryCatchHandler(requireActiveTenant, checkErpnextOnboarding, async (req, res) => {
  const tenant = req.tenant;
  const onboardingStatus = tenant.settings?.erpnextOnboardingStatus || {};
  res.status(200).json({ success: true, onboardingStatus });
}));

module.exports = router;