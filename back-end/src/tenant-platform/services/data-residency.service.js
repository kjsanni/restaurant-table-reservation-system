"use strict";

const db = require("../../db/models");

const REGIONS = {
  gh: { name: "Ghana", endpoint: "gh.db.example.com", latencyMs: 20 },
  us: { name: "United States", endpoint: "us.db.example.com", latencyMs: 120 },
  eu: { name: "Europe", endpoint: "eu.db.example.com", latencyMs: 150 },
};

const DataResidency = {
  async getTenantRegion(tenantId) {
    const tenant = await db.tenant.findByPk(tenantId, {
      attributes: ["dataRegion", "residencyNotes"],
    });
    if (!tenant) {
      return null;
    }
    return {
      region: tenant.dataRegion || "gh",
      notes: tenant.residencyNotes,
      config: REGIONS[tenant.dataRegion] || REGIONS.gh,
    };
  },

  async setTenantRegion(tenantId, region, notes = "") {
    const tenant = await db.tenant.findByPk(tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }
    if (!REGIONS[region]) {
      throw new Error(`Invalid region: ${region}`);
    }
    await tenant.update({ dataRegion: region, residencyNotes: notes });
    return { region, notes, config: REGIONS[region] };
  },

  async getRegionLatency(region) {
    const config = REGIONS[region];
    if (!config) {
      return null;
    }
    return {
      region,
      endpoint: config.endpoint,
      latencyMs: config.latencyMs,
      timestamp: new Date().toISOString(),
    };
  },

  async getAllRegions() {
    return Object.entries(REGIONS).map(([key, config]) => ({
      region: key,
      name: config.name,
      endpoint: config.endpoint,
      latencyMs: config.latencyMs,
    }));
  },
};

module.exports = DataResidency;
