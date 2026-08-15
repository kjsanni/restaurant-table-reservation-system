"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { requireActiveTenant } = require("../../../middleware/auth");

const checkErpnextAccounting = async (req, res, next) => {
  const tenant = req.tenant;
  if (!tenant) {
    return res.status(400).json({ success: false, message: "Tenant context required" });
  }
  const flags = tenant.settings?.featureFlags || {};
  if (!flags.erpnext_accounting) {
    return res.status(403).json({ success: false, message: "ERPNext Accounting is not enabled for this tenant" });
  }
  next();
};

router.get("/reports/ghana/pl", tryCatchHandler(requireActiveTenant, checkErpnextAccounting, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../../integrations/erpnext/client");
  const { from, to } = req.query;
  const filters = { company: tenant.name };
  if (from) filters.from_date = from;
  if (to) filters.to_date = to;
  try {
    const result = await (await getClient()).get("/api/resource/Profit and Loss Statement", { params: { filters } });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.get("/reports/ghana/balance-sheet", tryCatchHandler(requireActiveTenant, checkErpnextAccounting, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../../integrations/erpnext/client");
  const { from, to } = req.query;
  const filters = { company: tenant.name };
  if (from) filters.from_date = from;
  if (to) filters.to_date = to;
  try {
    const result = await (await getClient()).get("/api/resource/Balance Sheet", { params: { filters } });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.get("/reports/ghana/tax-compliance", tryCatchHandler(requireActiveTenant, checkErpnextAccounting, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../../integrations/erpnext/client");
  const { from, to } = req.query;
  const invoiceFilters = { company: tenant.name };
  if (from) invoiceFilters.from_date = from;
  if (to) invoiceFilters.to_date = to;
  try {
    const [taxTemplatesResult, invoicesResult] = await Promise.all([
      (await getClient()).get("/api/resource/Sales Taxes and Charges Template", {
        params: { filters: { company: tenant.name }, limit_page_length: 100 },
      }),
      (await getClient()).get("/api/resource/Sales Invoice", {
        params: {
          filters: invoiceFilters,
          fields: ["name", "posting_date", "total", "total_taxes_and_charges", "taxes_and_charges"],
          limit_page_length: 1000,
        },
      }),
    ]);

    const taxTemplates = taxTemplatesResult.data?.data || [];
    const invoices = invoicesResult.data?.data || [];

    const breakdown = invoices.reduce((acc, inv) => {
      const taxes = inv.taxes_and_charges || [];
      taxes.forEach((tax) => {
        const key = tax.account_head || "Unknown";
        acc[key] = (acc[key] || 0) + parseFloat(tax.tax_amount || 0);
      });
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        taxTemplates,
        totalInvoices: invoices.length,
        totalTaxCollected: invoices.reduce((sum, inv) => sum + parseFloat(inv.total_taxes_and_charges || 0), 0),
        taxBreakdown: breakdown,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

module.exports = router;
