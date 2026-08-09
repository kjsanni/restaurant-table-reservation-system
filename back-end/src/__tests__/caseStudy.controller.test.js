const { listCaseStudiesHandler, createCaseStudyHandler, updateCaseStudyHandler, removeCaseStudyHandler } = require("../tenant-platform/controllers/caseStudy.controller");

jest.mock("../tenant-platform/DAOs/caseStudy.dao", () => ({
  listCaseStudies: jest.fn(),
  createCaseStudy: jest.fn(),
  updateCaseStudy: jest.fn(),
  removeCaseStudy: jest.fn(),
}));

const caseStudyDAO = require("../tenant-platform/DAOs/caseStudy.dao");
const { createRes } = require("./utils/test-response");

function createReq(body = {}, params = {}, tenant = null) {
  return { body, params, user: { id: 1, tenant }, ip: "127.0.0.1" };
}

describe("caseStudy.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create rejects when title is missing", async () => {
    const req = createReq({ content: "test" });
    const res = createRes();
    await createCaseStudyHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("create strips tenantId and other non-whitelisted fields", async () => {
    caseStudyDAO.createCaseStudy.mockResolvedValue({ id: 1, title: "Test" });
    const req = createReq({ title: "Test", tenantId: 99, malicious: "ignored" });
    const res = createRes();
    await createCaseStudyHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(caseStudyDAO.createCaseStudy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Test" })
    );
    expect(caseStudyDAO.createCaseStudy).toHaveBeenCalledWith(
      expect.not.objectContaining({ tenantId: 99, malicious: "ignored" })
    );
  });

  it("update returns 404 when missing", async () => {
    caseStudyDAO.updateCaseStudy.mockResolvedValue(null);
    const req = createReq({ title: "New" }, { id: "5" }, { id: 1 });
    const res = createRes();
    await updateCaseStudyHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("delete returns 404 when missing", async () => {
    caseStudyDAO.removeCaseStudy.mockResolvedValue(false);
    const req = createReq({}, { id: "5" }, { id: 1 });
    const res = createRes();
    await removeCaseStudyHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
