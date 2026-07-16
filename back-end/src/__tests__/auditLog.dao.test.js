const { Sequelize } = require("sequelize");

jest.mock("../db/models", () => {
  const SequelizeLib = require("sequelize");
  const mockFn = jest.fn(() => "COUNT");
  const mockCol = jest.fn(() => "id");
  const mockFindAndCountAll = jest.fn();
  const mockFindAll = jest.fn();
  const mockDestroy = jest.fn();
  const MockAuditLog = {
    findAndCountAll: mockFindAndCountAll,
    findAll: mockFindAll,
    destroy: mockDestroy,
    sequelize: {
      fn: mockFn,
      col: mockCol,
    },
  };
  const MockUser = {};
  return {
    Sequelize: SequelizeLib,
    auditLog: MockAuditLog,
    user: MockUser,
    sequelize: {
      fn: mockFn,
      col: mockCol,
      Op: SequelizeLib.Op,
    },
  };
});

const db = require("../db/models");
const { Op } = db.Sequelize;
const auditLogDAO = require("../DAOs/auditLog.dao");

describe("auditLog.dao", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllLogs", () => {
    it("should return paginated logs with default options", async () => {
      db.auditLog.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: [
          { toJSON: () => ({ id: 1, action: "create", entityType: "reservation", entityId: 10, userId: 1, changes: null, ipAddress: "127.0.0.1", createdAt: "2026-07-16T10:00:00Z", user: { username: "admin", role: "admin" } }) },
          { toJSON: () => ({ id: 2, action: "update", entityType: "customer", entityId: 5, userId: 2, changes: "updated name to Test", ipAddress: "127.0.0.1", createdAt: "2026-07-16T09:00:00Z", user: { username: "staff", role: "staff" } }) },
        ],
      });

      const result = await auditLogDAO.getAllLogs();

      expect(result.logs).toHaveLength(2);
      expect(result.logs[0].action).toBe("Created");
      expect(result.logs[1].action).toBe("Updated");
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(25);
      expect(result.totalPages).toBe(1);
    });

    it("should apply date range filter", async () => {
      db.auditLog.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{ toJSON: () => ({ id: 1, action: "create", entityType: "reservation", entityId: 1, userId: 1, changes: null, ipAddress: "127.0.0.1", createdAt: "2026-07-16T10:00:00Z", user: { username: "admin", role: "admin" } }) }],
      });

      await auditLogDAO.getAllLogs({ from: "2026-07-01", to: "2026-07-16" });

      const where = db.auditLog.findAndCountAll.mock.calls[0][0].where;
      expect(where.createdAt[Op.gte]).toBe("2026-07-01");
      expect(where.createdAt[Op.lte]).toBe("2026-07-16");
    });

    it("should apply action and entity filters", async () => {
      db.auditLog.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{ toJSON: () => ({ id: 1, action: "create", entityType: "reservation", entityId: 1, userId: 1, changes: null, ipAddress: "127.0.0.1", createdAt: "2026-07-16T10:00:00Z", user: { username: "admin", role: "admin" } }) }],
      });

      await auditLogDAO.getAllLogs({ action: "create", entityType: "reservation" });

      const where = db.auditLog.findAndCountAll.mock.calls[0][0].where;
      expect(where.action).toBe("create");
      expect(where.entityType).toBe("reservation");
    });

    it("should support sorting", async () => {
      db.auditLog.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{ toJSON: () => ({ id: 1, action: "create", entityType: "reservation", entityId: 1, userId: 1, changes: null, ipAddress: "127.0.0.1", createdAt: "2026-07-16T10:00:00Z", user: { username: "admin", role: "admin" } }) }],
      });

      await auditLogDAO.getAllLogs({}, { sortBy: "action", sortOrder: "ASC" });

      const order = db.auditLog.findAndCountAll.mock.calls[0][0].order;
      expect(order).toEqual([["action", "ASC"]]);
    });
  });

  describe("getLogStats", () => {
    it("should return aggregated stats", async () => {
      db.auditLog.findAll
        .mockResolvedValueOnce([{ action: "create", count: "5" }])
        .mockResolvedValueOnce([{ entityType: "reservation", count: "10" }])
        .mockResolvedValueOnce([{ userId: "admin", count: "8" }]);

      const stats = await auditLogDAO.getLogStats();

      expect(stats.byAction).toEqual([{ action: "create", count: 5 }]);
      expect(stats.byEntity).toEqual([{ entityType: "reservation", count: 10 }]);
      expect(stats.topUsers).toEqual([{ userId: "admin", count: 8 }]);
      expect(stats.total).toBe(5);
    });
  });

  describe("bulkDeleteLogs", () => {
    it("should delete logs by ids", async () => {
      db.auditLog.destroy.mockResolvedValue(3);

      const deleted = await auditLogDAO.bulkDeleteLogs([1, 2, 3]);

      expect(db.auditLog.destroy).toHaveBeenCalledWith({ where: { id: [1, 2, 3] } });
      expect(deleted).toBe(3);
    });

    it("should return 0 for empty array", async () => {
      const deleted = await auditLogDAO.bulkDeleteLogs([]);
      expect(deleted).toBe(0);
      expect(db.auditLog.destroy).not.toHaveBeenCalled();
    });
  });

  describe("exportLogsCSV", () => {
    it("should generate CSV with headers and rows", async () => {
      db.auditLog.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{ toJSON: () => ({ id: 1, action: "create", entityType: "reservation", entityId: 1, userId: "admin", changes: null, ipAddress: "127.0.0.1", createdAt: "2026-07-16T10:00:00Z", user: { username: "admin", role: "admin" } }) }],
      });

      const csv = await auditLogDAO.exportLogsCSV();

      expect(csv).toContain("ID,Created At,User,Action,Entity,Entity ID,Changes,IP Address");
      expect(csv).toContain("1,2026-07-16T10:00:00Z,admin,Created,Reservation,1,,127.0.0.1");
    });
  });

  describe("exportLogsJSON", () => {
    it("should return JSON string of logs", async () => {
      db.auditLog.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{ toJSON: () => ({ id: 1, action: "create", entityType: "reservation", entityId: 1, userId: "admin", changes: null, ipAddress: "127.0.0.1", createdAt: "2026-07-16T10:00:00Z", user: { username: "admin", role: "admin" } }) }],
      });

      const json = await auditLogDAO.exportLogsJSON();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].action).toBe("Created");
    });
  });
});
