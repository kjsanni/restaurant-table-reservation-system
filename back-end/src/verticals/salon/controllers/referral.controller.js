"use strict";

const referralDao = require("../DAOs/referral.dao");

const createReferralHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const data = req.body;
    const referral = await referralDao.create(data, tenantId);
    return res.status(201).json({ success: true, data: referral });
  } catch (err) {
    console.error("createReferralHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to create referral" });
  }
};

const getReferralsHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { status, search } = req.query;
    const referrals = await referralDao.findAll(tenantId, { status, search });
    return res.status(200).json({ success: true, data: referrals });
  } catch (err) {
    console.error("getReferralsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load referrals" });
  }
};

const getReferralHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const referral = await referralDao.findById(id, tenantId);
    if (!referral) {
      return res.status(404).json({ success: false, message: "Referral not found" });
    }
    return res.status(200).json({ success: true, data: referral });
  } catch (err) {
    console.error("getReferralHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load referral" });
  }
};

const updateReferralHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const updated = await referralDao.update(id, tenantId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Referral not found" });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("updateReferralHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update referral" });
  }
};

const deleteReferralHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const removed = await referralDao.delete(id, tenantId);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Referral not found" });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("deleteReferralHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete referral" });
  }
};

module.exports = {
  createReferralHandler,
  getReferralsHandler,
  getReferralHandler,
  updateReferralHandler,
  deleteReferralHandler,
};
