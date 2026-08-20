"use strict";
const locationService = require("../verticals/salon/services/location.service");

const createHandler = async (req, res) => {
  try {
    const record = await locationService.create(req.body, req.tenant?.id);
    return res.status(201).json({ success: true, data: record });
  } catch (err) {
    console.error("createLocationHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to create Location" });
  }
};

const listHandler = async (req, res) => {
  try {
    const records = await locationService.findAll(req.tenant?.id);
    return res.status(200).json({ success: true, data: records });
  } catch (err) {
    console.error("getLocationsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load Locations" });
  }
};

const getHandler = async (req, res) => {
  try {
    const record = await locationService.findById(req.params.id, req.tenant?.id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Location not found" });
    }
    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    console.error("getLocationHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load Location" });
  }
};

const updateHandler = async (req, res) => {
  try {
    const updated = await locationService.update(req.params.id, req.tenant?.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Location not found" });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("updateLocationHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update Location" });
  }
};

const deleteHandler = async (req, res) => {
  try {
    const removed = await locationService.delete(req.params.id, req.tenant?.id);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Location not found" });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("deleteLocationHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete Location" });
  }
};

module.exports = {
  createLocationHandler: createHandler,
  getLocationsHandler: listHandler,
  getLocationHandler: getHandler,
  updateLocationHandler: updateHandler,
  deleteLocationHandler: deleteHandler,
};
