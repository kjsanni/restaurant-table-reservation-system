const db = require("../db/models");
const advancedAnalyticsController = require("../tenant-platform/controllers/advancedAnalytics.controller");

jest.mock("../db/models", () => ({
  tenant: { count: jest.fn(), findAll: jest.fn() },
  Sequelize: { Op: {} },
}));

describe("advancedAnalytics.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("getTenantGrowthMetricsHandler returns summary", async () => {
    db.tenant.count.mockResolvedValueOnce(10);
    db.tenant.findAll.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    await advancedAnalyticsController.getTenantGrowthMetricsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toMatchObject({ success: true });
  });

  it("getChurnAnalysisHandler returns churn data", async () => {
    db.tenant.findAll.mockResolvedValue([]);
    await advancedAnalyticsController.getChurnAnalysisHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toMatchObject({ success: true, totalChurned: 0 });
  });

  it("getLtvCacHandler returns LTV data", async () => {
    db.tenant.findAll.mockResolvedValue([
      { id: 1, name: "T1", plan: "starter", monthlyRevenue: 100, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    ]);
    await advancedAnalyticsController.getLtvCacHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toMatchObject({ success: true });
  });
});
