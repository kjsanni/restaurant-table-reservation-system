"use strict";

jest.mock("../db/models", () => ({
  tenantMigrationStatus: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  },
  sequelize: {
    fn: jest.fn(),
    col: jest.fn(),
  },
}));

const tenantMigrationStatusDAO = require("../tenant-platform/DAOs/tenantMigrationStatus.dao");
const db = require("../db/models");

describe("tenantMigrationStatusDAO", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a migration status record", async () => {
    const mockRecord = { id: 1, tenantId: 1, migrationName: "test-migration", status: "pending" };
    db.tenantMigrationStatus.create.mockResolvedValue(mockRecord);

    const result = await tenantMigrationStatusDAO.create({ tenantId: 1, migrationName: "test-migration" });
    expect(result).toEqual(mockRecord);
    expect(db.tenantMigrationStatus.create).toHaveBeenCalledWith({ tenantId: 1, migrationName: "test-migration" });
  });

  it("lists migration statuses with filters", async () => {
    db.tenantMigrationStatus.findAll.mockResolvedValue([{ id: 1 }]);

    const result = await tenantMigrationStatusDAO.list({ tenantId: 1, status: "pending" });
    expect(result).toEqual([{ id: 1 }]);
    expect(db.tenantMigrationStatus.findAll).toHaveBeenCalled();
  });

  it("finds by tenant and migration name", async () => {
    const mockRecord = { id: 1, tenantId: 1, migrationName: "test" };
    db.tenantMigrationStatus.findOne.mockResolvedValue(mockRecord);

    const result = await tenantMigrationStatusDAO.findByTenantAndMigration(1, "test");
    expect(result).toEqual(mockRecord);
    expect(db.tenantMigrationStatus.findOne).toHaveBeenCalledWith({ where: { tenantId: 1, migrationName: "test" } });
  });

  it("returns null when record not found for update", async () => {
    db.tenantMigrationStatus.findByPk.mockResolvedValue(null);

    const result = await tenantMigrationStatusDAO.update(999, { status: "running" });
    expect(result).toBeNull();
  });

  it("updates a record", async () => {
    const mockRecord = { id: 1, update: jest.fn().mockResolvedValue(true) };
    db.tenantMigrationStatus.findByPk.mockResolvedValue(mockRecord);

    const result = await tenantMigrationStatusDAO.update(1, { status: "running" });
    expect(result).toEqual(mockRecord);
    expect(mockRecord.update).toHaveBeenCalledWith({ status: "running" });
  });

  it("marks a record as running", async () => {
    const mockRecord = { id: 1, update: jest.fn().mockResolvedValue(true) };
    db.tenantMigrationStatus.findByPk.mockResolvedValue(mockRecord);

    const result = await tenantMigrationStatusDAO.markRunning(1);
    expect(result).toEqual(mockRecord);
    expect(mockRecord.update).toHaveBeenCalledWith({ status: "running", startedAt: expect.any(Date), error: null });
  });

  it("returns progress counts", async () => {
    db.tenantMigrationStatus.findAll.mockResolvedValue([
      { status: "pending", count: 2 },
      { status: "completed", count: 5 },
    ]);

    const result = await tenantMigrationStatusDAO.getProgress(1);
    expect(result).toEqual([
      { status: "pending", count: 2 },
      { status: "completed", count: 5 },
    ]);
  });
});
