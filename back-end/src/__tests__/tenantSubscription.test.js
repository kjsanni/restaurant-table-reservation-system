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
    mockTenantCount.mockResolvedValue(3);
    mockSequelizeQuery.mockResolvedValue([{ mrr: 108 }]);
    mockTenantFindAll.mockResolvedValue([]);

    const { getTenantDashboard } = require("../tenant-platform/services/tenantSubscription.service");
    const dashboard = await getTenantDashboard();

    expect(dashboard.mrr).toBe(108);
    expect(mockSequelizeQuery).toHaveBeenCalledTimes(1);
  });

  it("returns 0 MRR when no active tenants exist", async () => {
    mockTenantCount.mockResolvedValue(0);
    mockSequelizeQuery.mockResolvedValue([]);
    mockTenantFindAll.mockResolvedValue([]);

    const { getTenantDashboard } = require("../tenant-platform/services/tenantSubscription.service");
    const dashboard = await getTenantDashboard();

    expect(dashboard.mrr).toBe(0);
  });
});
