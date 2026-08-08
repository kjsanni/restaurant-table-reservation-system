"use strict";

const MODULE_METADATA = {
  erpnext_accounting: {
    name: "Accounting",
    description: "Invoice, payment, and financial ledger sync",
    dependencies: [],
    onboardingStep: "8A",
  },
  erpnext_stock: {
    name: "Inventory",
    description: "Stock items, warehouses, and stock ledger sync",
    dependencies: [],
    onboardingStep: "8B",
  },
  erpnext_crm: {
    name: "CRM",
    description: "Customer leads and campaign tracking",
    dependencies: [],
    onboardingStep: null,
  },
  erpnext_hr: {
    name: "HR",
    description: "Employee records, attendance, and payroll",
    dependencies: [],
    onboardingStep: "8C",
  },
  erpnext_pos: {
    name: "POS",
    description: "Point of sale integration",
    dependencies: ["erpnext_accounting", "erpnext_stock"],
    onboardingStep: null,
  },
  erpnext_manufacturing: {
    name: "Manufacturing",
    description: "BOM categories and production planning",
    dependencies: ["erpnext_stock"],
    onboardingStep: "8D",
  },
};

const getModuleMetadata = (flag) => {
  return MODULE_METADATA[flag] || null;
};

const getEnabledModules = (featureFlags) => {
  const enabled = [];
  for (const [flag, _metadata] of Object.entries(MODULE_METADATA)) {
    if (featureFlags[flag]) {
      enabled.push(flag);
    }
  }
  return enabled;
};

const validateModuleDependencies = (featureFlags, flag) => {
  const metadata = MODULE_METADATA[flag];
  if (!metadata) return { valid: true, missing: [] };

  const missing = metadata.dependencies.filter((dep) => !featureFlags[dep]);
  return { valid: missing.length === 0, missing };
};

const getAllModules = () => {
  return Object.keys(MODULE_METADATA);
};

module.exports = {
  MODULE_METADATA,
  getModuleMetadata,
  getEnabledModules,
  validateModuleDependencies,
  getAllModules,
};