const benchmarkDAO = require("../tenant-platform/DAOs/benchmark.dao");

jest.mock("../tenant-platform/DAOs/benchmark.dao", () => ({
  getPlatformBenchmarks: jest.fn(),
}));

const benchmarkController = require("../tenant-platform/controllers/benchmark.controller");

describe("benchmark.controller", () => {
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

  it("should return 200 with benchmark data", async () => {
    benchmarkDAO.getPlatformBenchmarks.mockResolvedValue({
      totalTenantsAnalyzed: 5,
      totalTenantsExcluded: 1,
      anonymityThreshold: 10,
      overall: {
        tenantCount: 5,
        avgNoShowRate: 12,
        avgFulfilmentRate: 78,
        avgCancellationRate: 10,
        avgPartySize: 2.5,
        avgReservationsPerTenant: 250,
      },
      byPlan: {
        growth: {
          tenantCount: 3,
          avgNoShowRate: 10,
          avgFulfilmentRate: 80,
          avgCancellationRate: 10,
          avgPartySize: 2.3,
          avgReservationsPerTenant: 300,
        },
      },
      byRestaurantType: {},
    });
    await benchmarkController.getBenchmarksHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      totalTenantsAnalyzed: 5,
      totalTenantsExcluded: 1,
      anonymityThreshold: 10,
      overall: expect.any(Object),
      byPlan: expect.any(Object),
      byRestaurantType: expect.any(Object),
    });
  });

  it("should pass plan filter to DAO", async () => {
    benchmarkDAO.getPlatformBenchmarks.mockResolvedValue({
      totalTenantsAnalyzed: 0,
      totalTenantsExcluded: 0,
      anonymityThreshold: 10,
      overall: null,
      byPlan: {},
      byRestaurantType: {},
    });
    req.query.plan = "growth";
    await benchmarkController.getBenchmarksHandler(req, res);
    expect(benchmarkDAO.getPlatformBenchmarks).toHaveBeenCalledWith("growth");
  });

  it("should return 500 on DAO error", async () => {
    benchmarkDAO.getPlatformBenchmarks.mockRejectedValue(new Error("db down"));
    await benchmarkController.getBenchmarksHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Failed to load benchmarks" });
  });
});
