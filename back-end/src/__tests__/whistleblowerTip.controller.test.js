const { createTipHandler, listTipsHandler, getTipHandler, updateTipHandler, getTipStatsHandler } = require("../tenant-platform/controllers/whistleblowerTip.controller");

jest.mock("../DAOs/whistleblowerTip.dao", () => ({
  createTip: jest.fn(),
  getTips: jest.fn(),
  getTipById: jest.fn(),
  updateTipStatus: jest.fn(),
  getTipStats: jest.fn(),
}));

const tipDAO = require("../DAOs/whistleblowerTip.dao");
const { createRes } = require("./utils/test-response");

function createReq(user = { id: 1, tenantId: null }, body = {}) {
  return { user, body, params: {}, query: {} };
}

describe("whistleblowerTip.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when category or description is missing", async () => {
    const req = createReq({ id: 1 }, {});
    const res = createRes();
    await createTipHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("creates a tip with valid data", async () => {
    tipDAO.createTip.mockResolvedValue({ id: 1, category: "fraud", description: "test" });
    const req = createReq({ id: 1, tenantId: 5 }, { category: "fraud", description: "test" });
    const res = createRes();
    await createTipHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(tipDAO.createTip).toHaveBeenCalledWith(5, {
      category: "fraud",
      description: "test",
      severity: "medium",
      contactInfo: null,
    });
  });
});
