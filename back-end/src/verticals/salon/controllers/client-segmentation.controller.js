"use strict";
const salonClientProfileDao = require("../DAOs/salonClientProfile.dao");

const getClientSegmentationHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const segmentation = await salonClientProfileDao.getSegmentation(tenantId);
    return res.status(200).json({ success: true, segmentation });
  } catch (err) {
    console.error("getClientSegmentationHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load segmentation" });
  }
};

const recordClientVisitHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { customerId, amount } = req.body;
    const profile = await salonClientProfileDao.recordVisit(tenantId, customerId, amount);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Client profile not found" });
    }
    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("recordClientVisitHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to record visit" });
  }
};

const markClientNoShowHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { customerId } = req.body;
    const profile = await salonClientProfileDao.markNoShow(tenantId, customerId);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Client profile not found" });
    }
    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("markClientNoShowHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to mark no-show" });
  }
};

module.exports = {
  getClientSegmentationHandler,
  recordClientVisitHandler,
  markClientNoShowHandler,
};
