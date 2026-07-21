"use strict";

const TYPE_DEFAULTS = {
  full_service: {
    serviceModes: ["dine_in", "takeaway", "delivery"],
    featureFlags: {
      table_management: true,
      waitlist: true,
      staff_scheduling: true,
      loyalty: true,
      pos_sync: false,
    },
  },
  quick_service: {
    serviceModes: ["takeaway", "delivery"],
    featureFlags: {
      table_management: false,
      waitlist: false,
      staff_scheduling: true,
      loyalty: true,
      pos_sync: true,
    },
  },
  cloud_kitchen: {
    serviceModes: ["delivery"],
    featureFlags: {
      table_management: false,
      waitlist: false,
      staff_scheduling: false,
      loyalty: true,
      pos_sync: true,
    },
  },
  cafe: {
    serviceModes: ["dine_in", "takeaway"],
    featureFlags: {
      table_management: true,
      waitlist: false,
      staff_scheduling: true,
      loyalty: false,
      pos_sync: false,
    },
  },
  bar: {
    serviceModes: ["dine_in", "takeaway"],
    featureFlags: {
      table_management: true,
      waitlist: true,
      staff_scheduling: true,
      loyalty: true,
      pos_sync: false,
    },
  },
};

const applyTypeDefaults = (tenant, restaurantType) => {
  const defaults = TYPE_DEFAULTS[restaurantType] || TYPE_DEFAULTS.full_service;

  if (!tenant.settings) {
    tenant.settings = {};
  }

  tenant.settings.featureFlags = { ...defaults.featureFlags };
  tenant.serviceModes = [...defaults.serviceModes];
  tenant.restaurantType = restaurantType;

  return tenant;
};

const getFeatureFlag = (tenant, flag) => {
  const flags = tenant?.settings?.featureFlags || {};
  return !!flags[flag];
};

const hasServiceMode = (tenant, mode) => {
  const modes = Array.isArray(tenant?.serviceModes) ? tenant.serviceModes : [];
  return modes.includes(mode);
};

module.exports = {
  TYPE_DEFAULTS,
  applyTypeDefaults,
  getFeatureFlag,
  hasServiceMode,
};
