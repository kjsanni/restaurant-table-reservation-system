jest.mock("../db/models", () => {
  const mockSession = { id: 1, superAdminId: 1, tenantId: 1, active: true, update: jest.fn().mockResolvedValue(true) };
  return {
    user: { findByPk: jest.fn().mockResolvedValue({ id: 1 }) },
    tenant: { findByPk: jest.fn().mockResolvedValue({ id: 1, status: "active" }) },
    impersonationSession: {
      create: jest.fn().mockResolvedValue(mockSession),
      findAll: jest.fn().mockResolvedValue([mockSession]),
      findByPk: jest.fn().mockResolvedValue(mockSession),
    },
    platformAuditLog: { create: jest.fn().mockResolvedValue({ id: 1 }) },
  };
});

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn().mockResolvedValue({ id: 1 }),
}));

const ImpersonationService = require("../tenant-platform/services/impersonation.service");

describe("Impersonation Service", () => {
  it("creates impersonation session", async () => {
    const session = await ImpersonationService.createImpersonationSession({ superAdminId: 1, tenantId: 1, reason: "Support" });
    expect(session).toHaveProperty("id");
  });

  it("ends impersonation session", async () => {
    const session = await ImpersonationService.endImpersonationSession(1, 1);
    expect(session).toHaveProperty("id");
  });

  it("gets active sessions", async () => {
    const sessions = await ImpersonationService.getActiveImpersonationSessions(1);
    expect(Array.isArray(sessions)).toBe(true);
  });
});
