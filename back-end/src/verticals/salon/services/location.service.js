"use strict";

const locationDao = require("../DAOs/location.dao");
const geocodingService = require("../../../services/geocoding.service");

const hasCoords = (loc) =>
  loc && loc.latitude != null && loc.longitude != null;

const locationService = {
  async findAll(tenantId) {
    return locationDao.findAll(tenantId);
  },

  async findById(id, tenantId) {
    return locationDao.findById(id, tenantId);
  },

  async create(data, tenantId) {
    if (!hasCoords(data) && data.address) {
      try {
        const geocoded = await geocodingService.geocodeAddress(data.address);
        if (geocoded && hasCoords(geocoded)) {
          data.latitude = geocoded.latitude;
          data.longitude = geocoded.longitude;
        }
      } catch (err) {
        console.error("Location geocoding failed:", err.message);
      }
    }
    return locationDao.create(data, tenantId);
  },

  async update(id, tenantId, updates) {
    const current = await locationDao.findById(id, tenantId);
    if (!current) return null;

    if (!hasCoords(updates)) {
      const address = updates.address || current.address;
      if (address) {
        try {
          const geocoded = await geocodingService.geocodeAddress(address);
          if (geocoded && hasCoords(geocoded)) {
            updates.latitude = geocoded.latitude;
            updates.longitude = geocoded.longitude;
          }
        } catch (err) {
          console.error("Location geocoding failed:", err.message);
        }
      }
    }
    return locationDao.update(id, tenantId, updates);
  },

  async delete(id, tenantId) {
    return locationDao.delete(id, tenantId);
  },
};

module.exports = locationService;
