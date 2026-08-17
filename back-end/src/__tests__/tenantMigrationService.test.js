"use strict";

jest.mock("../tenant-platform/DAOs/tenantMigrationStatus.dao");
jest.mock("../tenant-platform/DAOs/platformAudit.dao");

const tenantMigrationStatusDAO = require("../tenant-platform/DAOs/tenantMigrationStatus.dao");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const tenantMigrationService = require("../tenant-platform/services/tenantMigration.service");

describe("tenantMigrationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("enqueue", () => {
    it("creates a new pending record when none exists", async () => {
      tenantMigrationStatusDAO.findByTenantAndMigration.mockResolvedValue(null);
      tenantMigrationStatusDAO.create.mockResolvedValue({ id: 1, tenantId: 1, migrationName: "m1", status: "pending" });

      const result = await tenantMigrationService.enqueue({
        tenantId: 1,
        migrationName: "m1",
        performedBy: 10,
        ip: "127.0.0.1",
      });

      expect(result).toEqual({ id: 1, tenantId: 1, migrationName: "m1", status: "pending" });
      expect(tenantMigrationStatusDAO.create).toHaveBeenCalledWith({
        tenantId: 1,
        migrationName: "m1",
        status: "pending",
        metadata: {},
      });
      expect(platformAuditDAO.log).toHaveBeenCalledWith(10, "migration.enqueued", "tenant_migration", 1, null, { tenantId: 1, migrationName: "m1" }, "127.0.0.1");
    });

    it("returns existing record if not rolled back", async () => {
      const existing = { id: 2, tenantId: 1, migrationName: "m1", status: "running" };
      tenantMigrationStatusDAO.findByTenantAndMigration.mockResolvedValue(existing);

      const result = await tenantMigrationService.enqueue({ tenantId: 1, migrationName: "m1" });
      expect(result).toEqual(existing);
      expect(tenantMigrationStatusDAO.create).not.toHaveBeenCalled();
    });

    it("re-enqueues a rolled back record", async () => {
      const rolledBack = { id: 3, tenantId: 1, migrationName: "m1", status: "rolled_back", metadata: {} };
      tenantMigrationStatusDAO.findByTenantAndMigration.mockResolvedValue(rolledBack);
      tenantMigrationStatusDAO.updateByTenantAndMigration.mockResolvedValue({ ...rolledBack, status: "pending" });

      const result = await tenantMigrationService.enqueue({ tenantId: 1, migrationName: "m1" });
      expect(result.status).toBe("pending");
      expect(tenantMigrationStatusDAO.updateByTenantAndMigration).toHaveBeenCalled();
    });
  });

  describe("run", () => {
    it("runs a migration successfully", async () => {
      const record = { id: 1, tenantId: 1, migrationName: "m1", status: "pending", toJSON: () => ({ id: 1 }) };
      const completedRecord = { id: 1, tenantId: 1, migrationName: "m1", status: "completed", toJSON: () => ({ id: 1, status: "completed" }) };
      tenantMigrationStatusDAO.findById.mockResolvedValueOnce(record).mockResolvedValueOnce(completedRecord);
      tenantMigrationStatusDAO.markRunning.mockResolvedValue(record);
      tenantMigrationStatusDAO.markCompleted.mockResolvedValue(completedRecord);

      const runner = jest.fn().mockResolvedValue({ metadata: { rows: 100 } });

      const result = await tenantMigrationService.run(1, runner, 10, "127.0.0.1");

      expect(runner).toHaveBeenCalledWith(record);
      expect(platformAuditDAO.log).toHaveBeenCalledWith(10, "migration.completed", "tenant_migration", 1, null, { tenantId: 1, migrationName: "m1", result: { metadata: { rows: 100 } } }, "127.0.0.1");
      expect(result.status).toBe("completed");
    });

    it("fails when migration runner throws", async () => {
      const record = { id: 1, tenantId: 1, migrationName: "m1", status: "pending", toJSON: () => ({ id: 1 }) };
      tenantMigrationStatusDAO.findById.mockResolvedValue(record);
      tenantMigrationStatusDAO.markRunning.mockResolvedValue(record);
      tenantMigrationStatusDAO.markFailed.mockResolvedValue(record);

      const runner = jest.fn().mockRejectedValue(new Error("DB error"));

      await expect(tenantMigrationService.run(1, runner, 10, "127.0.0.1")).rejects.toThrow("DB error");
      expect(tenantMigrationStatusDAO.markFailed).toHaveBeenCalledWith(1, "DB error");
    });

    it("throws 404 when record not found", async () => {
      tenantMigrationStatusDAO.findById.mockResolvedValue(null);

      await expect(tenantMigrationService.run(999, jest.fn(), 10)).rejects.toMatchObject({ status: 404 });
    });

    it("throws 409 when status transition is invalid", async () => {
      const record = { id: 1, status: "completed" };
      tenantMigrationStatusDAO.findById.mockResolvedValue(record);

      await expect(tenantMigrationService.run(1, jest.fn(), 10)).rejects.toMatchObject({ status: 409 });
    });
  });

  describe("pause", () => {
    it("pauses a running migration", async () => {
      const record = { id: 1, status: "running" };
      tenantMigrationStatusDAO.findById.mockResolvedValue(record);
      tenantMigrationStatusDAO.markPaused.mockResolvedValue({ ...record, status: "paused" });

      const result = await tenantMigrationService.pause(1, 10, "127.0.0.1");
      expect(result.status).toBe("paused");
      expect(tenantMigrationStatusDAO.markPaused).toHaveBeenCalledWith(1);
    });

    it("throws 409 when trying to pause a non-running migration", async () => {
      const record = { id: 1, status: "pending" };
      tenantMigrationStatusDAO.findById.mockResolvedValue(record);

      await expect(tenantMigrationService.pause(1, 10)).rejects.toMatchObject({ status: 409 });
    });
  });

  describe("resume", () => {
    it("resumes a paused migration", async () => {
      const record = { id: 1, tenantId: 1, migrationName: "m1", status: "paused", toJSON: () => ({ id: 1 }) };
      const completedRecord = { id: 1, tenantId: 1, migrationName: "m1", status: "completed", toJSON: () => ({ id: 1, status: "completed" }) };
      tenantMigrationStatusDAO.findById.mockResolvedValueOnce(record).mockResolvedValueOnce(completedRecord);
      tenantMigrationStatusDAO.markResumed.mockResolvedValue(record);
      tenantMigrationStatusDAO.markCompleted.mockResolvedValue(completedRecord);

      const runner = jest.fn().mockResolvedValue({ metadata: {} });

      const result = await tenantMigrationService.resume(1, runner, 10, "127.0.0.1");
      expect(result.status).toBe("completed");
      expect(tenantMigrationStatusDAO.markResumed).toHaveBeenCalledWith(1);
    });
  });

  describe("rollback", () => {
    it("rolls back a completed migration", async () => {
      const record = { id: 1, tenantId: 1, migrationName: "m1", status: "completed" };
      tenantMigrationStatusDAO.findById.mockResolvedValue(record);
      tenantMigrationStatusDAO.markRolledBack.mockResolvedValue({ ...record, status: "rolled_back" });

      const result = await tenantMigrationService.rollback(1, null, 10, "127.0.0.1");
      expect(result.status).toBe("rolled_back");
      expect(tenantMigrationStatusDAO.markRolledBack).toHaveBeenCalledWith(1, 10);
    });

    it("runs rollback runner when provided", async () => {
      const record = { id: 1, tenantId: 1, migrationName: "m1", status: "completed" };
      tenantMigrationStatusDAO.findById.mockResolvedValue(record);
      tenantMigrationStatusDAO.markRolledBack.mockResolvedValue({ ...record, status: "rolled_back" });

      const rollbackRunner = jest.fn().mockResolvedValue(true);

      await tenantMigrationService.rollback(1, rollbackRunner, 10, "127.0.0.1");
      expect(rollbackRunner).toHaveBeenCalledWith(record);
    });

    it("throws 409 when trying to rollback a pending migration", async () => {
      const record = { id: 1, status: "pending" };
      tenantMigrationStatusDAO.findById.mockResolvedValue(record);

      await expect(tenantMigrationService.rollback(1, null, 10)).rejects.toMatchObject({ status: 409 });
    });
  });

  describe("getStatus", () => {
    it("returns aggregated status for a tenant", async () => {
      tenantMigrationStatusDAO.getPendingForTenant.mockResolvedValue([{ id: 1, toJSON: () => ({ id: 1 }) }]);
      tenantMigrationStatusDAO.getRunningForTenant.mockResolvedValue([{ id: 2, toJSON: () => ({ id: 2 }) }]);
      tenantMigrationStatusDAO.getFailedForTenant.mockResolvedValue([]);
      tenantMigrationStatusDAO.getProgress.mockResolvedValue([{ status: "pending", count: 1 }]);

      const result = await tenantMigrationService.getStatus(1);

      expect(result).toEqual({
        pending: [{ id: 1 }],
        running: [{ id: 2 }],
        failed: [],
        progress: [{ status: "pending", count: 1 }],
      });
    });
  });
});
