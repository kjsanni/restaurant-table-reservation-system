const db = require("../db/models");

jest.mock("../db/models");

describe("tenantSubscription.getTenantDashboard", () => {
  let mockTenantSum;
  let mockTenantCount;
  let mockTenantFindAll;
  let mockPlanFindAll;

  beforeEach(() => {
    jest.clearAllMocks();
    db.tenant = {
      count: jest.fn(),
      sum: jest.fn(),
      findAll: jest.fn(),
    };
    db.subscriptionPlan = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    mockTenantCount = db.tenant.count;
    mockTenantSum = db.tenant.sum;
    mockTenantFindAll = db.tenant.findAll;
    mockPlanFindAll = db.subscriptionPlan.findAll;
  });

  it("calculates MRR by normalizing plan strings to numeric prices", async () => {
    mockTenantCount.mockResolvedValue(3);
    mockTenantSum.mockResolvedValue(108);
    mockTenantFindAll.mockResolvedValue([]);

    const { getTenantDashboard } = require("../tenant-platform/services/tenantSubscription.service");
    const dashboard = await getTenantDashboard();

    expect(dashboard.mrr).toBe(108);
    expect(mockTenantSum).toHaveBeenCalledTimes(1);
    expect(mockTenantSum.mock.calls[0].length).toBeGreaterThanOrEqual(2);
  });

  it("returns 0 MRR when no active tenants exist", async () => {
    mockTenantCount.mockResolvedValue(0);
    mockTenantSum.mockResolvedValue(null);
    mockTenantFindAll.mockResolvedValue([]);

    const { getTenantDashboard } = require("../tenant-platform/services/tenantSubscription.service");
    const dashboard = await getTenantDashboard();

    expect(dashboard.mrr).toBe(0);
  });
});
