"use strict";
const serviceDao = require("../DAOs/service.dao");

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
