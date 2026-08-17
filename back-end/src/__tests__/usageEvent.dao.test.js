const db = require("../db/models");
const usageEventDAO = require("../tenant-platform/DAOs/usageEvent.dao");

jest.mock("../db/models", () => ({
  usageEvent: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findAll: jest.fn(),
  },
  Sequelize: {
    Op: { gte: "gte", lte: "lte" },
  },
}));

describe("usageEventDAO", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("record", () => {
    it("records a usage event for a tenant", async () => {
      db.usageEvent.create.mockResolvedValue({ id: 1, tenantId: 1, resource: "tables", action: "created" });

      const result = await usageEventDAO.record({ tenantId: 1, resource: "tables", action: "created" });

      expect(db.usageEvent.create).toHaveBeenCalledWith({
        tenantId: 1,
        resource: "tables",
        action: "created",
        quantity: 1,
        metadata: {},
      });
      expect(result.id).toBe(1);
    });

    it("skips recording when tenantId is missing", async () => {
      await usageEventDAO.record({ tenantId: null, resource: "tables", action: "created" });
      expect(db.usageEvent.create).not.toHaveBeenCalled();
    });
  });

  describe("getTenantUsageHistory", () => {
    it("returns paginated usage events for a tenant", async () => {
      db.usageEvent.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [
          { id: 1, tenantId: 1, resource: "tables", action: "created", quantity: 1, metadata: {}, createdAt: "2026-08-15T00:00:00Z" },
        ],
      });

      const result = await usageEventDAO.getTenantUsageHistory(1, { limit: 10, offset: 0 });

      expect(db.usageEvent.findAndCountAll).toHaveBeenCalled();
      expect(result.collection).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it("filters by resource and date range", async () => {
      db.usageEvent.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await usageEventDAO.getTenantUsageHistory(1, { resource: "reservations", from: "2026-08-01", to: "2026-08-15" });

      expect(db.usageEvent.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            resource: "reservations",
          }),
        })
      );
    });
  });

  describe("getPlatformUsageSummary", () => {
    it("aggregates usage events by resource and action", async () => {
      db.usageEvent.findAll.mockResolvedValue([
        { tenantId: 1, resource: "tables", action: "created", quantity: 2 },
        { tenantId: 1, resource: "reservations", action: "created", quantity: 1 },
        { tenantId: 2, resource: "tables", action: "created", quantity: 1 },
      ]);

      const result = await usageEventDAO.getPlatformUsageSummary();

      expect(result.totalEvents).toBe(3);
      expect(result.uniqueTenants).toBe(2);
      expect(result.summary["tables:created"]).toBe(3);
      expect(result.summary["reservations:created"]).toBe(1);
    });
  });
});
