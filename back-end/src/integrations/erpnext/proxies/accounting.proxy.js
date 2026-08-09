"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { requireActiveTenant } = require("../../../middleware/auth");
const { syncCustomer, syncAllCustomers } = require("../sync/customer.sync");
const { syncInvoice, syncAllInvoices } = require("../sync/invoice.sync");
const { syncPayment, syncAllPayments } = require("../sync/payment.sync");

const checkErpnextFeature = async (req, res, next) => {
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

router.get("/health", tryCatchHandler(async (req, res) => {
  const { healthCheck } = require("../client");
  const result = await healthCheck();
  res.status(200).json({ success: true, ...result });
}));

router.get("/accounting/company", tryCatchHandler(requireActiveTenant, checkErpnextFeature, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  try {
    const result = await getClient().get(`/api/resource/Company/${tenant.name}`);
    res.status(200).json({ success: true, data: result.data });
  } catch {
    res.status(404).json({ success: false, message: "ERPNext company not found. Complete ERPNext onboarding first." });
  }
}));

router.get("/accounting/profit-loss", tryCatchHandler(requireActiveTenant, checkErpnextFeature, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { from, to } = req.query;
  const filters = { company: tenant.name };
  if (from) filters.from_date = from;
  if (to) filters.to_date = to;
  try {
    const result = await getClient().get("/api/resource/Profit and Loss Statement", { params: { filters } });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.get("/accounting/balance-sheet", tryCatchHandler(requireActiveTenant, checkErpnextFeature, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { from, to } = req.query;
  const filters = { company: tenant.name };
  if (from) filters.from_date = from;
  if (to) filters.to_date = to;
  try {
    const result = await getClient().get("/api/resource/Balance Sheet", { params: { filters } });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.get("/accounting/tax-report", tryCatchHandler(requireActiveTenant, checkErpnextFeature, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { from, to } = req.query;
  const filters = { company: tenant.name };
  if (from) filters.from_date = from;
  if (to) filters.to_date = to;
  try {
    const result = await getClient().get("/api/resource/GST Settings", {
      params: { filters: { company: tenant.name } },
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.get("/accounting/invoices", tryCatchHandler(requireActiveTenant, checkErpnextFeature, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { status, from, to, page = 1, pageSize = 20 } = req.query;
  const filters = { company: tenant.name };
  if (status) filters.status = status;
  if (from) filters.from_date = from;
  if (to) filters.to_date = to;
  try {
    const result = await getClient().get("/api/resource/Sales Invoice", {
      params: { filters, page, page_length: parseInt(pageSize, 10) },
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.get("/accounting/invoices/:invoiceId", tryCatchHandler(requireActiveTenant, checkErpnextFeature, async (req, res) => {
  const _tenant = req.tenant;
  const { invoiceId } = req.params;
  const { getClient } = require("../client");
  try {
    const result = await getClient().get(`/api/resource/Sales Invoice/${invoiceId}`);
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.get("/accounting/payments", tryCatchHandler(requireActiveTenant, checkErpnextFeature, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { from, to, page = 1, pageSize = 20 } = req.query;
  const filters = { company: tenant.name };
  if (from) filters.from_date = from;
  if (to) filters.to_date = to;
  try {
    const result = await getClient().get("/api/resource/Payment Entry", {
      params: { filters, page, page_length: parseInt(pageSize, 10) },
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.get("/accounting/customers", tryCatchHandler(requireActiveTenant, checkErpnextFeature, async (req, res) => {
  const tenant = req.tenant;
  const { getClient } = require("../client");
  const { search, page = 1, pageSize = 20 } = req.query;
  const filters = { company: tenant.name };
  if (search) filters.name = ["like", `%${search}%`];
  try {
    const result = await getClient().get("/api/resource/Customer", {
      params: { filters, page, page_length: parseInt(pageSize, 10) },
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.post("/accounting/sync/customers", tryCatchHandler(requireActiveTenant, checkErpnextFeature, async (req, res) => {
  const tenant = req.tenant;
  const { customerIds } = req.body;
  try {
    if (customerIds && customerIds.length > 0) {
      const results = [];
      for (const customerId of customerIds) {
        const result = await syncCustomer(tenant.id, customerId);
        results.push(result);
      }
      res.status(200).json({ success: true, results });
    } else {
      const results = await syncAllCustomers(tenant.id);
      res.status(200).json({ success: true, results });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.post("/accounting/sync/invoices", tryCatchHandler(requireActiveTenant, checkErpnextFeature, async (req, res) => {
  const tenant = req.tenant;
  const { reservationIds } = req.body;
  try {
    if (reservationIds && reservationIds.length > 0) {
      const results = [];
      for (const reservationId of reservationIds) {
        const result = await syncInvoice(tenant.id, reservationId);
        results.push(result);
      }
      res.status(200).json({ success: true, results });
    } else {
      const results = await syncAllInvoices(tenant.id);
      res.status(200).json({ success: true, results });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

router.post("/accounting/sync/payments", tryCatchHandler(requireActiveTenant, checkErpnextFeature, async (req, res) => {
  const tenant = req.tenant;
  const { paymentIds } = req.body;
  try {
    if (paymentIds && paymentIds.length > 0) {
      const results = [];
      for (const paymentId of paymentIds) {
        const result = await syncPayment(tenant.id, paymentId);
        results.push(result);
      }
      res.status(200).json({ success: true, results });
    } else {
      const results = await syncAllPayments(tenant.id);
      res.status(200).json({ success: true, results });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}));

module.exports = router;