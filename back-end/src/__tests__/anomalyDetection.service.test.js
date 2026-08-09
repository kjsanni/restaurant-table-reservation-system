jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  findAllForUser: jest.fn(),
}));

const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const anomalyDetectionService = require("../services/anomalyDetection.service");

function createReq(user = { id: 1 }, overrides = {}) {
  return {
    user,
    ip: "192.168.1.1",
    get: jest.fn(() => "Mozilla/5.0"),
    ...overrides,
  };
}

describe("anomalyDetection.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("evaluate", () => {
    beforeEach(() => {
      const frozenDate = new Date();
      frozenDate.setUTCHours(12, 0, 0, 0);
      jest.useFakeTimers().setSystemTime(frozenDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("calls next() without anomalies when no rules match", async () => {
      platformAuditDAO.findAllForUser.mockResolvedValue([]);
      const req = createReq();
      const next = jest.fn();

      const frozenDate = new Date();
      frozenDate.setUTCHours(12, 0, 0, 0);
      jest.useFakeTimers().setSystemTime(frozenDate);

      await anomalyDetectionService.evaluate(req, null, next);
      expect(next).toHaveBeenCalled();
      expect(req.anomalies).toBeUndefined();

      jest.useRealTimers();
    });

    it("detects new IP login anomaly", async () => {
      const recentActions = [
        { action: "super_admin.access_granted", metadata: { ipAddress: "10.0.0.1" }, createdAt: new Date() },
      ];
      platformAuditDAO.findAllForUser.mockResolvedValue(recentActions);
      const req = createReq();
      const next = jest.fn();
      await anomalyDetectionService.evaluate(req, null, next);
      expect(next).toHaveBeenCalled();
      expect(req.anomalies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "new_ip_login",
            severity: "medium",
            description: expect.stringContaining("New IP address detected"),
          }),
        ])
      );
    });

    it("detects after-hours access anomaly", async () => {
      platformAuditDAO.findAllForUser.mockResolvedValue([]);
      const req = createReq({ id: 1 }, {});
      const next = jest.fn();

      const frozenDate = new Date();
      frozenDate.setUTCHours(3, 0, 0, 0);
      jest.useFakeTimers().setSystemTime(frozenDate);

      await anomalyDetectionService.evaluate(req, null, next);
      expect(next).toHaveBeenCalled();
      expect(req.anomalies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "after_hours_access",
            severity: "low",
            description: expect.stringContaining("Access during off-hours"),
          }),
        ])
      );

      jest.useRealTimers();
    });

    it("detects high-frequency platform actions", async () => {
      const now = new Date();
      const recentActions = Array.from({ length: 5 }, (_, i) => ({
        action: "tenant.create",
        createdAt: new Date(now.getTime() + i * 1000),
      }));
      platformAuditDAO.findAllForUser.mockResolvedValue(recentActions);
      const req = createReq();
      const next = jest.fn();
      await anomalyDetectionService.evaluate(req, null, next);
      expect(req.anomalies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "bulk_export",
            severity: "high",
            description: expect.stringContaining("High-frequency platform actions"),
          }),
        ])
      );
    });

    it("detects auth burst pattern", async () => {
      const now = new Date();
      const deniedActions = Array.from({ length: 3 }, () => ({
        action: "super_admin.access_denied",
        createdAt: now,
      }));
      const grantedActions = Array.from({ length: 2 }, () => ({
        action: "super_admin.access_granted",
        createdAt: now,
      }));

      const Op = require("sequelize").Op;
      platformAuditDAO.findAllForUser.mockImplementation((userId, filters) => {
        const actionValue = filters?.action?.[Op.in] || filters?.action;
        if (Array.isArray(actionValue) && actionValue.includes("super_admin.access_denied")) {
          return Promise.resolve(deniedActions);
        }
        return Promise.resolve(grantedActions);
      });

      const req = createReq();
      const next = jest.fn();
      await anomalyDetectionService.evaluate(req, null, next);
      expect(req.anomalies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "auth_burst",
            severity: "high",
            description: expect.stringContaining("Auth burst pattern"),
          }),
        ])
      );
    });

    it("handles missing userId gracefully", async () => {
      const req = { user: null };
      const next = jest.fn();
      await anomalyDetectionService.evaluate(req, null, next);
      expect(next).toHaveBeenCalled();
      expect(req.anomalies).toBeUndefined();
    });

    it("handles errors gracefully and still calls next()", async () => {
      platformAuditDAO.findAllForUser.mockRejectedValue(new Error("DB down"));
      const req = createReq();
      const next = jest.fn();
      await anomalyDetectionService.evaluate(req, null, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("getRules", () => {
    it("returns anomaly rule constants", () => {
      const rules = anomalyDetectionService.getRules();
      expect(rules).toEqual({
        NEW_IP_LOGIN: "new_ip_login",
        AFTER_HOURS_ACCESS: "after_hours_access",
        BULK_EXPORT: "bulk_export",
        COMPLIANCE_CHANGE: "compliance_change",
        AUTH_BURST: "auth_burst",
      });
    });
  });

  describe("getSeverityLevels", () => {
    it("returns severity constants", () => {
      const severities = anomalyDetectionService.getSeverityLevels();
      expect(severities).toEqual({
        LOW: "low",
        MEDIUM: "medium",
        HIGH: "high",
        CRITICAL: "critical",
      });
    });
  });
});
