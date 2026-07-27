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
