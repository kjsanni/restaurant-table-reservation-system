const { listComplianceEvidenceHandler, createComplianceEvidenceHandler, updateComplianceEvidenceHandler, deleteComplianceEvidenceHandler } = require("../tenant-platform/controllers/complianceEvidence.controller");

jest.mock("../tenant-platform/DAOs/complianceEvidence.dao", () => ({
  list: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn(),
}));

const complianceEvidenceDAO = require("../tenant-platform/DAOs/complianceEvidence.dao");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const { createRes } = require("./utils/test-response");

function createReq(user = { id: 1 }, body = {}, params = {}) {
  return { user, body, params, query: {}, ip: "127.0.0.1" };
}

describe("complianceEvidence.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create rejects when required fields missing", async () => {
    const req = createReq({ id: 1 }, {});
    const res = createRes();
    await createComplianceEvidenceHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("create strips non-whitelisted fields and logs audit", async () => {
    complianceEvidenceDAO.create.mockResolvedValue({ id: 1, framework: "SOC2" });
    const req = createReq({ id: 1 }, { framework: "SOC2", controlId: "A1", title: "Test", malicious: "ignored" });
    const res = createRes();
    await createComplianceEvidenceHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(complianceEvidenceDAO.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ malicious: "ignored" })
    );
    expect(platformAuditDAO.log).toHaveBeenCalled();
  });

  it("update returns 404 when missing", async () => {
    complianceEvidenceDAO.findById.mockResolvedValue(null);
    const req = createReq({ id: 1 }, { status: "completed" }, { id: "5" });
    const res = createRes();
    await updateComplianceEvidenceHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("delete returns 404 when missing", async () => {
    complianceEvidenceDAO.remove.mockResolvedValue(null);
    const req = createReq({ id: 1 }, {}, { id: "5" });
    const res = createRes();
    await deleteComplianceEvidenceHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
