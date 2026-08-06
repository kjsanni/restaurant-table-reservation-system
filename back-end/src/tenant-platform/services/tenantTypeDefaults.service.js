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
  dine_in_only: {
    serviceModes: ["dine_in"],
    featureFlags: {
      table_management: true,
      waitlist: true,
      staff_scheduling: true,
      loyalty: false,
      pos_sync: false,
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
    salon_payment_config: { currency: "GHS", depositRequired: false, defaultDepositPercent: 0, enabledChannels: ["card_paystack"], momoProviders: ["mtn_momo", "vodafone_cash", "airtel_tigo"] },
    salon_sms_fallback_enabled: false,
  },
};

const FLAG_CATEGORIES = {
  restaurant: {
    label: "Restaurant",
    flags: {
      table_management: { label: "Table Management", description: "Enable table mapping, floor plans, and table assignments" },
      waitlist: { label: "Waitlist", description: "Allow customers to join a digital waitlist" },
      staff_scheduling: { label: "Staff Scheduling", description: "Shift scheduling, attendance, and station assignments" },
      loyalty: { label: "Loyalty", description: "Points, rewards, and customer loyalty programs" },
      pos_sync: { label: "POS Sync", description: "Sync orders and payments with external POS systems" },
    },
  },
  salon: {
    label: "Salon",
    flags: {
      salon_appointments: { label: "Appointments", description: "Calendar-based appointment booking" },
      salon_walkins: { label: "Walk-ins", description: "Walk-in customer check-in and queue" },
      salon_client_profiles: { label: "Client Profiles", description: "Client history, preferences, and notes" },
      salon_whatsapp_booking: { label: "WhatsApp Booking", description: "Receive and confirm bookings via WhatsApp" },
      salon_module_enabled: { label: "Salon Module", description: "Enable the full salon vertical (switches business mode)" },
    },
  },
  erpnext: {
    label: "ERPNext",
    flags: {
      erpnext_accounting: { label: "Accounting", description: "Invoice, payment, and financial ledger sync", dependencies: [] },
      erpnext_stock: { label: "Inventory", description: "Stock items, warehouses, and stock ledger sync", dependencies: [] },
      erpnext_crm: { label: "CRM", description: "Customer leads and campaign tracking", dependencies: [] },
      erpnext_hr: { label: "HR", description: "Employee records, attendance, and payroll", dependencies: [] },
      erpnext_pos: { label: "POS", description: "Point of sale integration", dependencies: ["erpnext_accounting", "erpnext_stock"] },
      erpnext_manufacturing: { label: "Manufacturing", description: "BOM categories and production planning", dependencies: ["erpnext_stock"] },
    },
  },
};

const ALL_FEATURE_FLAGS = Object.values(FLAG_CATEGORIES).flatMap((category) => Object.keys(category.flags));

const applyTypeDefaults = (tenant, restaurantType) => {
  const defaults = TYPE_DEFAULTS[restaurantType] || TYPE_DEFAULTS.full_service;

  tenant.settings = {
    ...(tenant.settings || {}),
    featureFlags: { ...defaults.featureFlags },
  };
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
  FLAG_CATEGORIES,
  ALL_FEATURE_FLAGS,
  applyTypeDefaults,
  getFeatureFlag,
  hasServiceMode,
  seedSalonSettings,
};
