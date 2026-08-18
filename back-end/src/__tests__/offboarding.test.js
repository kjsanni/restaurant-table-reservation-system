jest.mock("../db/models", () => {
  const mockFindAll = jest.fn().mockResolvedValue([]);
  const mockTenant = { id: 1, name: "Test", findByPk: jest.fn().mockResolvedValue({ id: 1, name: "Test", update: jest.fn() }) };
  return {
    tenant: mockTenant,
    table: { findAll: mockFindAll },
    reservation: { findAll: mockFindAll },
    customer: { findAll: mockFindAll },
    user: { findAll: mockFindAll },
    platformAuditLog: { create: jest.fn().mockResolvedValue({ id: 1 }) },
    sequelize: { query: jest.fn().mockResolvedValue([]) },
  };
});

const OffboardingService = require("../tenant-platform/services/offboarding.service");

describe("Offboarding Service", () => {
  it("initiates offboarding", async () => {
    const result = await OffboardingService.initiateOffboarding(1, 1);
    expect(result.success).toBe(true);
  });

  it("exports tenant data", async () => {
    const data = await OffboardingService.exportTenantData(1);
    expect(data).toHaveProperty("tenant");
    expect(data).toHaveProperty("tables");
  });

  it("anonymizes tenant data", async () => {
    const result = await OffboardingService.anonymizeTenantData(1);
    expect(result.success).toBe(true);
  });

  it("deletes tenant data", async () => {
    const result = await OffboardingService.deleteTenantData(1);
    expect(result.success).toBe(true);
  });
});
