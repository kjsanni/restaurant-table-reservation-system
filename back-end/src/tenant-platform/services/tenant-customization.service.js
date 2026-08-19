"use strict";

const db = require("../../db/models");

const TenantCustomization = {
  async getThemeSettings(tenantId) {
    const tenant = await db.tenant.findByPk(tenantId, {
      attributes: ["settings"],
    });
    if (!tenant) {
      return null;
    }
    return tenant.settings?.theme || {};
  },

  async setThemeSettings(tenantId, themeSettings) {
    const tenant = await db.tenant.findByPk(tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }
    const settings = tenant.settings || {};
    settings.theme = { ...settings.theme, ...themeSettings };
    await tenant.update({ settings });
    return settings.theme;
  },

  async getLocaleSettings(tenantId) {
    const tenant = await db.tenant.findByPk(tenantId, {
      attributes: ["settings"],
    });
    if (!tenant) {
      return null;
    }
    return tenant.settings?.locale || { language: "en", strings: {} };
  },

  async setLocaleStrings(tenantId, strings) {
    const tenant = await db.tenant.findByPk(tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }
    const settings = tenant.settings || {};
    settings.locale = { ...settings.locale, strings: { ...settings.locale?.strings, ...strings } };
    await tenant.update({ settings });
    return settings.locale;
  },

  async getCustomDomain(tenantId) {
    const tenant = await db.tenant.findByPk(tenantId, {
      attributes: ["domain", "slug"],
    });
    if (!tenant) {
      return null;
    }
    return { domain: tenant.domain, slug: tenant.slug };
  },

  async setCustomDomain(tenantId, domain) {
    const tenant = await db.tenant.findByPk(tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }
    await tenant.update({ domain });
    return { domain, slug: tenant.slug };
  },

  async removeCustomDomain(tenantId) {
    const tenant = await db.tenant.findByPk(tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }
    await tenant.update({ domain: null });
    return { domain: null, slug: tenant.slug };
  },
};

module.exports = TenantCustomization;
