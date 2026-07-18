"use strict";

/**
 * Load-test scenario definitions.
 *
 * Each scenario describes a weighted mix of endpoints to exercise. The runner
 * builds autocannon "requests" arrays from these definitions, injecting the
 * per-session auth cookies + tenant headers + CSRF token.
 *
 * Weights are relative; the runner expands them into an autocannon request list.
 *
 * `body` is a function so we can generate fresh, valid payloads per scenario.
 */

const today = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
};

// A recent 30-day window for revenue/report queries.
const rangeFrom = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};
const rangeTo = () => new Date().toISOString().slice(0, 10);
const REVENUE_QS = `from=${rangeFrom()}&to=${rangeTo()}&granularity=day`;

const scenarios = {
  // ---- Read-heavy realistic browsing mix (the common case) ----
  mixed_read: {
    description: "Realistic authenticated browsing: reservations/tables/customers reads",
    requests: [
      { method: "GET", path: "/reservations?page=1&limit=20", weight: 30 },
      { method: "GET", path: "/reservations/stats", weight: 10 },
      { method: "GET", path: "/tables", weight: 20 },
      { method: "GET", path: "/customers/search?q=Cust", weight: 15 },
      { method: "GET", path: "/reservations/heatmap-v2", weight: 10 },
      { method: "GET", path: "/auth/me", weight: 15 },
    ],
  },

  // ---- Reservation CRUD ----
  reservation_crud: {
    description: "Reservation create + read mix (write path, CSRF protected)",
    requests: [
      { method: "GET", path: "/reservations?page=1&limit=20", weight: 40 },
      { method: "GET", path: "/reservations/search?q=", weight: 20 },
      { method: "GET", path: "/reservations/stats", weight: 20 },
      // Peak reservation creation. registerHandler validates against tables/customers.
      {
        method: "POST",
        path: "/reservations",
        weight: 20,
        csrf: true,
        body: () => ({
          firstName: "Load",
          lastName: "Tester",
          email: `res${Date.now()}${Math.floor(Math.random() * 1000)}@load.test`,
          phone: String(6000000000 + Math.floor(Math.random() * 999999)).slice(-10),
          resDate: today(),
          resTime: "19:00:00",
          people: 2,
        }),
      },
    ],
  },

  // ---- Customer management ----
  customer_mgmt: {
    description: "Customer search reads (search + tag filters)",
    requests: [
      { method: "GET", path: "/customers/search?q=Cust", weight: 50 },
      { method: "GET", path: "/customers/search?q=cust1", weight: 30 },
      { method: "GET", path: "/customers/search?q=Tenant", weight: 20 },
    ],
  },

  // ---- Table management ----
  table_mgmt: {
    description: "Table listing + waiting-staff reads",
    requests: [
      { method: "GET", path: "/tables", weight: 70 },
      { method: "GET", path: "/tables/staff", weight: 30 },
    ],
  },

  // ---- Payment processing (read summaries; writes require reservation FK) ----
  payments: {
    description: "Payment summary + revenue time-series reads",
    requests: [
      { method: "GET", path: "/reservations/payment-summary", weight: 50 },
      { method: "GET", path: `/reservations/revenue/time-series?${REVENUE_QS}`, weight: 50 },
    ],
  },

  // ---- Report generation (heaviest DB queries) ----
  reports: {
    description: "Analytics/report endpoints (heavy aggregation queries)",
    requests: [
      { method: "GET", path: "/reports/reservations", weight: 25 },
      { method: "GET", path: "/reports/time-series?range=30d", weight: 20 },
      { method: "GET", path: "/reports/customers", weight: 20 },
      { method: "GET", path: "/reports/tables/utilization", weight: 15 },
      { method: "GET", path: "/reports/turn-time", weight: 10 },
      { method: "GET", path: "/reports/no-shows", weight: 10 },
    ],
  },

  // ---- Tenant isolation probe (used by the leak checker, low volume) ----
  tenant_probe: {
    description: "Per-tenant reservation listing used for cross-tenant leak checks",
    requests: [{ method: "GET", path: "/reservations?page=1&limit=50", weight: 100 }],
  },
};

module.exports = scenarios;
