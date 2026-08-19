const db = require("../db/models");
const legalAcceptanceDAO = require("../tenant-platform/DAOs/legalAcceptance.dao");

jest.mock("../db/models", () => ({
  legalAcceptance: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

describe("legalAcceptanceDAO", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("list filters by tenantId, customerId, slug, and accepted", async () => {
    db.legalAcceptance.findAll.mockResolvedValue([{ id: 1 }]);
    const result = await legalAcceptanceDAO.list({
      tenantId: 1,
      customerId: 2,
      slug: "privacy",
      accepted: true,
    });
    expect(db.legalAcceptance.findAll).toHaveBeenCalledWith({
      where: { tenantId: 1, customerId: 2, slug: "privacy", accepted: true },
      order: [["createdAt", "DESC"]],
      limit: 100,
    });
    expect(result).toEqual([{ id: 1 }]);
  });

  it("list defaults limit to 100", async () => {
    db.legalAcceptance.findAll.mockResolvedValue([]);
    await legalAcceptanceDAO.list({});
    expect(db.legalAcceptance.findAll).toHaveBeenCalledWith({
      where: {},
      order: [["createdAt", "DESC"]],
      limit: 100,
    });
  });

  it("listByTenant returns acceptances for tenant", async () => {
    db.legalAcceptance.findAll.mockResolvedValue([{ id: 1, tenantId: 1 }]);
    const result = await legalAcceptanceDAO.listByTenant(1);
    expect(db.legalAcceptance.findAll).toHaveBeenCalledWith({
      where: { tenantId: 1 },
      order: [["createdAt", "DESC"]],
    });
    expect(result).toEqual([{ id: 1, tenantId: 1 }]);
  });

  it("findLatest returns latest acceptance for tenant and slug", async () => {
    db.legalAcceptance.findOne.mockResolvedValue({ id: 1, slug: "privacy" });
    const result = await legalAcceptanceDAO.findLatest(1, "privacy");
    expect(db.legalAcceptance.findOne).toHaveBeenCalledWith({
      where: { tenantId: 1, slug: "privacy" },
      order: [["createdAt", "DESC"]],
    });
    expect(result).toEqual({ id: 1, slug: "privacy" });
  });

  it("record creates acceptance with customerId", async () => {
    db.legalAcceptance.create.mockResolvedValue({
      id: 1,
      tenantId: 1,
      userId: 2,
      customerId: 3,
      slug: "privacy",
      version: "1.0",
      ipAddress: "127.0.0.1",
      userAgent: "test",
    });
    const result = await legalAcceptanceDAO.record({
      tenantId: 1,
      userId: 2,
      customerId: 3,
      slug: "privacy",
      version: "1.0",
      ipAddress: "127.0.0.1",
      userAgent: "test",
    });
    expect(db.legalAcceptance.create).toHaveBeenCalledWith({
      tenantId: 1,
      userId: 2,
      customerId: 3,
      slug: "privacy",
      version: "1.0",
      ipAddress: "127.0.0.1",
      userAgent: "test",
    });
    expect(result.customerId).toBe(3);
  });

  it("record coerces nullish customerId/userId/ipAddress/userAgent to null", async () => {
    db.legalAcceptance.create.mockResolvedValue({
      id: 2,
      tenantId: 1,
      userId: null,
      customerId: null,
      slug: "terms",
      version: "1.0",
      ipAddress: null,
      userAgent: null,
    });
    const result = await legalAcceptanceDAO.record({
      tenantId: 1,
      slug: "terms",
      version: "1.0",
    });
    expect(db.legalAcceptance.create).toHaveBeenCalledWith({
      tenantId: 1,
      userId: null,
      customerId: null,
      slug: "terms",
      version: "1.0",
      ipAddress: null,
      userAgent: null,
    });
    expect(result.customerId).toBeNull();
  });
});
