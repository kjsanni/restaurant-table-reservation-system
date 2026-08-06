const { listEncryptionKeysHandler, createEncryptionKeyHandler, rotateEncryptionKeyHandler, retireEncryptionKeyHandler, deleteEncryptionKeyHandler } = require("../tenant-platform/controllers/encryptionKey.controller");

jest.mock("../tenant-platform/DAOs/encryptionKey.dao", () => ({
  list: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn(),
}));

const encryptionKeyDAO = require("../tenant-platform/DAOs/encryptionKey.dao");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const { createRes } = require("./utils/test-response");

function createReq(user = { id: 1 }, body = {}, params = {}) {
  return { user, body, params, ip: "127.0.0.1" };
}

describe("encryptionKey.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create accepts whitelisted fields and strips non-whitelisted fields", async () => {
    encryptionKeyDAO.create.mockResolvedValue({ id: 1, name: "Key", purpose: "data_at_rest" });
    const req = createReq({ id: 1 }, { name: "Key", purpose: "data_at_rest", algorithm: "AES-256", status: "retired", maliciousField: "ignored" });
    const res = createRes();
    await createEncryptionKeyHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(encryptionKeyDAO.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Key", purpose: "data_at_rest", algorithm: "AES-256" })
    );
    expect(encryptionKeyDAO.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ status: "retired", maliciousField: "ignored" })
    );
  });

  it("create rejects when name is missing", async () => {
    const req = createReq({ id: 1 }, { purpose: "data_at_rest" });
    const res = createRes();
    await createEncryptionKeyHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(encryptionKeyDAO.create).not.toHaveBeenCalled();
  });

  it("rotate updates status to rotating", async () => {
    encryptionKeyDAO.findById.mockResolvedValue({ id: 1, name: "Key" });
    encryptionKeyDAO.update.mockResolvedValue({ id: 1, status: "rotating" });
    const req = createReq({ id: 1 }, {}, { id: "1" });
    const res = createRes();
    await rotateEncryptionKeyHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(encryptionKeyDAO.update).toHaveBeenCalledWith(1, expect.objectContaining({ status: "rotating" }));
  });

  it("retire updates status to retired", async () => {
    encryptionKeyDAO.findById.mockResolvedValue({ id: 1, name: "Key" });
    encryptionKeyDAO.update.mockResolvedValue({ id: 1, status: "retired" });
    const req = createReq({ id: 1 }, {}, { id: "1" });
    const res = createRes();
    await retireEncryptionKeyHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(encryptionKeyDAO.update).toHaveBeenCalledWith(1, expect.objectContaining({ status: "retired" }));
  });

  it("delete returns 404 when not found", async () => {
    encryptionKeyDAO.remove.mockReturnValue(null);
    const req = createReq({ id: 1 }, {}, { id: "999" });
    const res = createRes();
    await deleteEncryptionKeyHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
