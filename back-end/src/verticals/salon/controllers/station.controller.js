"use strict";
const stationDao = require("../DAOs/station.dao");

const stationController = {
  async getAllStations(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const result = await stationDao.findAllForTenant(tenantId, req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getStation(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const station = await stationDao.findById(req.params.id, tenantId);
      if (!station) {
        return res.status(404).json({ success: false, message: "Station not found" });
      }
      res.json({ success: true, data: station });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createStation(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const data = { ...req.body, tenantId };
      const station = await stationDao.create(data);
      res.status(201).json({ success: true, data: station });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateStation(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const station = await stationDao.update(req.params.id, tenantId, req.body);
      if (!station) {
        return res.status(404).json({ success: false, message: "Station not found" });
      }
      res.json({ success: true, data: station });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteStation(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const deleted = await stationDao.delete(req.params.id, tenantId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Station not found" });
      }
      res.json({ success: true, message: "Station deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getStationUtilization(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const start = req.query.start ? new Date(req.query.start) : new Date(new Date().setHours(0, 0, 0, 0));
      const end = req.query.end ? new Date(req.query.end) : new Date(new Date().setHours(23, 59, 59, 999));
      const utilization = await stationDao.getUtilization(tenantId, start, end);
      res.json({ success: true, data: utilization });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getAggregateUtilization(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const start = req.query.start ? new Date(req.query.start) : new Date(new Date().setHours(0, 0, 0, 0));
      const end = req.query.end ? new Date(req.query.end) : new Date(new Date().setHours(23, 59, 59, 999));
      const utilization = await stationDao.getUtilization(tenantId, start, end);
      res.json({ success: true, data: utilization });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = stationController;
