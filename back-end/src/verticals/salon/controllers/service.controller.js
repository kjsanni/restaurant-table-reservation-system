"use strict";
const serviceDao = require("../DAOs/service.dao");

const validateService = (data) => {
  const errors = [];
  if (!data.name || typeof data.name !== "string" || data.name.trim().length < 1 || data.name.length > 100) {
    errors.push("name must be a string between 1 and 100 characters");
  }
  if (data.price !== undefined && (typeof data.price !== "number" || data.price < 0)) {
    errors.push("price must be a non-negative number");
  }
  if (data.durationMinutes !== undefined && (!Number.isInteger(data.durationMinutes) || data.durationMinutes < 5)) {
    errors.push("durationMinutes must be an integer >= 5");
  }
  if (data.bufferMinutes !== undefined && (!Number.isInteger(data.bufferMinutes) || data.bufferMinutes < 0)) {
    errors.push("bufferMinutes must be a non-negative integer");
  }
  return errors;
};

const serviceController = {
  async getAllServices(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const result = await serviceDao.findAllForTenant(tenantId, req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getService(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const service = await serviceDao.findById(req.params.id, tenantId);
      if (!service) {
        return res.status(404).json({ success: false, message: "Service not found" });
      }
      res.json({ success: true, data: service });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createService(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const validationErrors = validateService(req.body);
      if (validationErrors.length > 0) {
        return res.status(422).json({ success: false, message: "Validation failed", errors: validationErrors });
      }
      const data = { ...req.body, tenantId };
      const service = await serviceDao.create(data);
      res.status(201).json({ success: true, data: service });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateService(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const validationErrors = validateService(req.body);
      if (validationErrors.length > 0) {
        return res.status(422).json({ success: false, message: "Validation failed", errors: validationErrors });
      }
      const service = await serviceDao.update(req.params.id, tenantId, req.body);
      if (!service) {
        return res.status(404).json({ success: false, message: "Service not found" });
      }
      res.json({ success: true, data: service });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteService(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const deleted = await serviceDao.delete(req.params.id, tenantId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Service not found" });
      }
      res.json({ success: true, message: "Service deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = serviceController;
