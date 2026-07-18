"use strict";

/**
 * Shared configuration for the load-testing harness.
 *
 * Everything is overridable via environment variables so the same scripts can
 * target a local dev box, a staging environment, or a dedicated load-test box.
 * These scripts are NEVER meant to run against production.
 */

const BASE_URL = process.env.LOAD_BASE_URL || "http://127.0.0.1:8000";
const API = `${BASE_URL}/api/v1`;

module.exports = {
  BASE_URL,
  API,

  // How many synthetic tenants to provision / exercise.
  TENANT_COUNT: parseInt(process.env.LOAD_TENANTS || "100", 10),

  // Slug/name prefix used for every synthetic tenant so cleanup is trivial.
  TENANT_PREFIX: process.env.LOAD_TENANT_PREFIX || "loadtest",

  // Credentials assigned to every seeded tenant admin user.
  ADMIN_PASSWORD: process.env.LOAD_ADMIN_PASSWORD || "LoadTest123!",

  // Baseline data volume seeded per tenant so read queries have rows to scan.
  TABLES_PER_TENANT: parseInt(process.env.LOAD_TABLES || "20", 10),
  CUSTOMERS_PER_TENANT: parseInt(process.env.LOAD_CUSTOMERS || "200", 10),
  RESERVATIONS_PER_TENANT: parseInt(process.env.LOAD_RESERVATIONS || "500", 10),

  // Default autocannon knobs (per-scenario overrides live in scenarios.js).
  CONNECTIONS: parseInt(process.env.LOAD_CONNECTIONS || "50", 10),
  DURATION: parseInt(process.env.LOAD_DURATION || "20", 10),
  PIPELINING: parseInt(process.env.LOAD_PIPELINING || "1", 10),

  // Whether the target server has TENANT_MODE=enabled. Purely informational —
  // used to label output. The harness always sends X-Tenant-Id headers; a
  // single-tenant server simply ignores them.
  TENANT_MODE: process.env.LOAD_TENANT_MODE || process.env.TENANT_MODE || "unknown",
};
