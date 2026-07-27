"use strict";

const locationDao = require("../DAOs/location.dao");

const createLocationHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const data = req.body;
    const location = await locationDao.create(data, tenantId);
    return res.status(201).json({ success: true, data: location });
  } catch (err) {
    console.error("createLocationHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to create location" });
  }
};

const getLocationsHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const locations = await locationDao.findAll(tenantId);
    return res.status(200).json({ success: true, data: locations });
  } catch (err) {
    console.error("getLocationsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load locations" });
  }
};

const getLocationHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const location = await locationDao.findById(id, tenantId);
    if (!location) {
      return res.status(404).json({ success: false, message: "Location not found" });
    }
    return res.status(200).json({ success: true, data: location });
  } catch (err) {
    console.error("getLocationHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load location" });
  }
};

const updateLocationHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const updated = await locationDao.update(id, tenantId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Location not found" });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("updateLocationHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update location" });
  }
};

const deleteLocationHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const removed = await locationDao.delete(id, tenantId);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Location not found" });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("deleteLocationHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete location" });
  }
};

module.exports = {
  createLocationHandler,
  getLocationsHandler,
  getLocationHandler,
  updateLocationHandler,
  deleteLocationHandler,
};
