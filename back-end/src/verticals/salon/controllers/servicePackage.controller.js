"use strict";

const servicePackageDao = require("../DAOs/servicePackage.dao");

const createServicePackageHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const data = req.body;
    const servicePackage = await servicePackageDao.create(data, tenantId);
    return res.status(201).json({ success: true, data: servicePackage });
  } catch (err) {
    console.error("createServicePackageHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to create package" });
  }
};

const getServicePackagesHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { isAvailable, search } = req.query;
    const packages = await servicePackageDao.findAll(tenantId, { isAvailable, search });
    return res.status(200).json({ success: true, data: packages });
  } catch (err) {
    console.error("getServicePackagesHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load packages" });
  }
};

const getServicePackageHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const package_ = await servicePackageDao.findById(id, tenantId);
    if (!package_) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }
    return res.status(200).json({ success: true, data: package_ });
  } catch (err) {
    console.error("getServicePackageHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load package" });
  }
};

const updateServicePackageHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const updated = await servicePackageDao.update(id, tenantId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("updateServicePackageHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update package" });
  }
};

const deleteServicePackageHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const removed = await servicePackageDao.delete(id, tenantId);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("deleteServicePackageHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete package" });
  }
};

module.exports = {
  createServicePackageHandler,
  getServicePackagesHandler,
  getServicePackageHandler,
  updateServicePackageHandler,
  deleteServicePackageHandler,
};
