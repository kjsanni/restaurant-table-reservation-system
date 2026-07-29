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
  salon: {
    serviceModes: ["appointments", "walkins"],
    featureFlags: {
      table_management: false,
      waitlist: false,
      staff_scheduling: true,
      loyalty: false,
      pos_sync: false,
      salon_appointments: true,
      salon_walkins: true,
      salon_client_profiles: true,
      salon_whatsapp_booking: true,
      erpnext_accounting: false,
      erpnext_stock: false,
      erpnext_crm: false,
      erpnext_hr: false,
      erpnext_pos: false,
      erpnext_manufacturing: false,
    },
  },
  salonDefaults: {
    salon_whatsapp_config: { enabled: false, phoneNumberId: "", token: "" },
    salon_payment_config: { currency: "GHS", depositRequired: false, defaultDepositPercent: 0 },
    salon_sms_fallback_enabled: false,
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

const seedSalonSettings = async (tenantId) => {
  const { updateSetting } = require("../../DAOs/auth.dao");
  const defaults = TYPE_DEFAULTS.salonDefaults || {};
  for (const [key, value] of Object.entries(defaults)) {
    await updateSetting(key, value, tenantId);
  }
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
  seedSalonSettings,
};
