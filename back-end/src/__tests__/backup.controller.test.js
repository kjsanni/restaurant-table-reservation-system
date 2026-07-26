const backupController = require("../tenant-platform/controllers/backup.controller");

jest.mock("../tenant-platform/DAOs/backupRecord.dao");
jest.mock("../tenant-platform/services/backup.service");
jest.mock("../tenant-platform/DAOs/platformAudit.dao");

describe("backup.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { params: {}, body: {}, user: { id: 1 }, ip: "127.0.0.1" };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      download: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("executeBackupHandler updates record and succeeds", async () => {
    const dao = require("../tenant-platform/DAOs/backupRecord.dao");
    dao.findById.mockResolvedValue({ id: 1, type: "full" });
    dao.update.mockResolvedValue({ id: 1, status: "running" });
    const service = require("../tenant-platform/services/backup.service");
    service.runBackup.mockResolvedValue({ path: "/tmp/backup.sql", fileName: "backup.sql", sizeBytes: 100, type: "full" });
    dao.findById.mockResolvedValueOnce({ id: 1, status: "completed" });

    await backupController.executeBackupHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("restoreBackupHandler returns dryRun result", async () => {
    const dao = require("../tenant-platform/DAOs/backupRecord.dao");
    dao.findById.mockResolvedValue({ id: 1, storagePath: "/tmp/backup.sql" });
    const service = require("../tenant-platform/services/backup.service");
    service.runRestore.mockResolvedValue({ dryRun: true, statementCount: 10, sizeBytes: 100 });

    req.body = { dryRun: true };
    await backupController.restoreBackupHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, dryRun: true, statementCount: 10, sizeBytes: 100 });
  });

  it("downloadBackupHandler sends file", async () => {
    const fs = require("fs");
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest.spyOn(fs, "statSync").mockReturnValue({ size: 100 });

    const dao = require("../tenant-platform/DAOs/backupRecord.dao");
    dao.findById.mockResolvedValue({ id: 1, storagePath: "/tmp/backup.sql", fileName: "backup.sql" });

    await backupController.downloadBackupHandler(req, res);
    expect(res.download).toHaveBeenCalledWith("/tmp/backup.sql", "backup.sql");
  });
});
