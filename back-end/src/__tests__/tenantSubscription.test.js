const db = require("../db/models");

jest.mock("../db/models");

describe("tenantSubscription.getTenantDashboard", () => {
  let mockSequelizeQuery;
  let mockTenantCount;
  let mockTenantFindAll;
  let mockPlanFindAll;

  beforeEach(() => {
    jest.clearAllMocks();
    db.tenant = {
      count: jest.fn(),
      findAll: jest.fn(),
    };
    db.subscriptionPlan = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    db.sequelize = {
      query: jest.fn(),
      QueryTypes: { SELECT: "SELECT" },
    };
    mockSequelizeQuery = db.sequelize.query;
    mockTenantCount = db.tenant.count;
    mockTenantFindAll = db.tenant.findAll;
    mockPlanFindAll = db.subscriptionPlan.findAll;
  });

  it("calculates MRR by normalizing plan strings to numeric prices", async () => {
    mockPlanFindAll.mockResolvedValue([
      { slug: "starter", price: 29 },
      { slug: "growth", price: 79 },
    ]);
    mockTenantFindAll.mockResolvedValue([
      { plan: "starter" },
      { plan: "growth" },
      { plan: "growth" },
    ]);

    const { getTenantDashboard } = require("../tenant-platform/services/tenantSubscription.service");
    const dashboard = await getTenantDashboard();

    expect(dashboard.mrr).toBe(187);
  });

  it("returns 0 MRR when no active tenants exist", async () => {
    mockPlanFindAll.mockResolvedValue([
      { slug: "starter", price: 29 },
    ]);
    mockTenantFindAll.mockResolvedValue([]);

    const { getTenantDashboard } = require("../tenant-platform/services/tenantSubscription.service");
    const dashboard = await getTenantDashboard();

    expect(dashboard.mrr).toBe(0);
  });
});

describe("tenantSubscription.checkUsageLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { invalidatePlansCache } = require("../tenant-platform/services/tenantSubscription.service");
    invalidatePlansCache();
    db.tenant = {
      count: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
    };
    db.table = { count: jest.fn() };
    db.reservation = { count: jest.fn() };
    db.subscriptionPlan = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    db.sequelize = {
      query: jest.fn(),
      QueryTypes: { SELECT: "SELECT" },
    };
    db.Sequelize = { Op: { gte: "gte" } };
  });

  it("allows table creation when under starter limit", async () => {
    db.subscriptionPlan.findAll.mockResolvedValue([{ slug: "starter", maxTables: 10, maxReservationsPerMonth: 500 }]);
    db.tenant.findByPk.mockResolvedValue({ plan: "starter" });
    db.table.count.mockResolvedValue(3);

    const { checkUsageLimit } = require("../tenant-platform/services/tenantSubscription.service");
    await expect(checkUsageLimit(1, "tables")).resolves.toBeUndefined();
  });

  it("throws 403 when table limit reached", async () => {
    db.subscriptionPlan.findAll.mockResolvedValue([{ slug: "starter", maxTables: 10, maxReservationsPerMonth: 500 }]);
    db.tenant.findByPk.mockResolvedValue({ plan: "starter" });
    db.table.count.mockResolvedValue(10);

    const { checkUsageLimit } = require("../tenant-platform/services/tenantSubscription.service");
    await expect(checkUsageLimit(1, "tables")).rejects.toMatchObject({ status: 403 });
  });

  it("allows reservations when under monthly limit", async () => {
    db.subscriptionPlan.findAll.mockResolvedValue([{ slug: "starter", maxTables: 10, maxReservationsPerMonth: 500 }]);
    db.tenant.findByPk.mockResolvedValue({ plan: "starter" });
    db.reservation.count.mockResolvedValue(100);

    const { checkUsageLimit } = require("../tenant-platform/services/tenantSubscription.service");
    await expect(checkUsageLimit(1, "reservations")).resolves.toBeUndefined();
  });

  it("throws 403 when monthly reservation limit reached", async () => {
    db.subscriptionPlan.findAll.mockResolvedValue([{ slug: "starter", maxTables: 10, maxReservationsPerMonth: 500 }]);
    db.tenant.findByPk.mockResolvedValue({ plan: "starter" });
    db.reservation.count.mockResolvedValue(500);

    const { checkUsageLimit } = require("../tenant-platform/services/tenantSubscription.service");
    await expect(checkUsageLimit(1, "reservations")).rejects.toMatchObject({ status: 403 });
  });

  it("skips limit check for enterprise plan", async () => {
    db.subscriptionPlan.findAll.mockResolvedValue([{ slug: "enterprise", maxTables: 100, maxReservationsPerMonth: 10000 }]);
    db.tenant.findByPk.mockResolvedValue({ plan: "enterprise" });

    const { checkUsageLimit } = require("../tenant-platform/services/tenantSubscription.service");
    await expect(checkUsageLimit(1, "tables")).resolves.toBeUndefined();
    await expect(checkUsageLimit(1, "reservations")).resolves.toBeUndefined();
  });

  it("throws 404 when tenant does not exist", async () => {
    db.subscriptionPlan.findAll.mockResolvedValue([{ slug: "starter", maxTables: 10, maxReservationsPerMonth: 500 }]);
    db.tenant.findByPk.mockResolvedValue(null);

    const { checkUsageLimit } = require("../tenant-platform/services/tenantSubscription.service");
    await expect(checkUsageLimit(999, "tables")).rejects.toMatchObject({ status: 404 });
  });
});
