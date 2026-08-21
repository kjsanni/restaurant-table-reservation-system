"use strict";

const unifiedCustomerService = require("../services/unifiedCustomer.service");

const getUnifiedProfileHandler = async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId, 10) || req.customer?.id;
    if (!customerId) {
      return res.status(400).json({ success: false, message: "Customer ID is required" });
    }
    const profile = await unifiedCustomerService.getUnifiedProfile(customerId, req.tenant?.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.status(200).json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCrossVerticalHistoryHandler = async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId, 10) || req.customer?.id;
    if (!customerId) {
      return res.status(400).json({ success: false, message: "Customer ID is required" });
    }
    const history = await unifiedCustomerService.getCrossVerticalHistory(customerId, req.tenant?.id);
    res.status(200).json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addLoyaltyPointsHandler = async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId, 10) || req.customer?.id;
    const { points, source } = req.body;
    if (!points || Number(points) <= 0) {
      return res.status(400).json({ success: false, message: "Invalid points value" });
    }
    const customer = await unifiedCustomerService.addLoyaltyPoints(customerId, Number(points), source, req.tenant?.id);
    res.status(200).json({ success: true, customer });
  } catch (err) {
    const status = err.message === "Customer not found" ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
};

const redeemLoyaltyPointsHandler = async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId, 10) || req.customer?.id;
    const { points } = req.body;
    if (!points || Number(points) <= 0) {
      return res.status(400).json({ success: false, message: "Invalid points value" });
    }
    const customer = await unifiedCustomerService.redeemLoyaltyPoints(customerId, Number(points), req.tenant?.id);
    res.status(200).json({ success: true, customer });
  } catch (err) {
    const status = err.message === "Customer not found" ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
};

module.exports = {
  getUnifiedProfileHandler,
  getCrossVerticalHistoryHandler,
  addLoyaltyPointsHandler,
  redeemLoyaltyPointsHandler,
};
