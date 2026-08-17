const usageController = require("../tenant-platform/controllers/usage.controller");

jest.mock("../tenant-platform/DAOs/usage.dao");
jest.mock("../tenant-platform/DAOs/usageEvent.dao");

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
};

describe("usage.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTenantUsageHistoryHandler", () => {
    it("returns paginated usage history for a tenant", async () => {
      const req = { params: { id: "1" }, query: { limit: "10", offset: "0" } };
      const res = makeRes();
      require("../tenant-platform/DAOs/usageEvent.dao").getTenantUsageHistory.mockResolvedValue({
        collection: [],
        pagination: { total: 0, limit: 10, offset: 0 },
      });

      await usageController.getTenantUsageHistoryHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          collection: [],
        })
      );
    });
  });

  describe("getPlatformUsageSummaryHandler", () => {
    it("returns platform usage summary for super-admin", async () => {
      const req = { query: {} };
      const res = makeRes();
      require("../tenant-platform/DAOs/usageEvent.dao").getPlatformUsageSummary.mockResolvedValue({
        totalEvents: 10,
        uniqueTenants: 3,
        summary: {},
      });

      await usageController.getPlatformUsageSummaryHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          item: expect.objectContaining({ totalEvents: 10 }),
        })
      );
    });
  });
});
