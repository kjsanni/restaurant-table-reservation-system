const dataAnonymizationController = require("../tenant-platform/controllers/dataAnonymization.controller");

jest.mock("../tenant-platform/DAOs/dataAnonymization.dao", () => ({
  anonymizeTenant: jest.fn(),
}));

const dataAnonymizationDAO = require("../tenant-platform/DAOs/dataAnonymization.dao");

function createReq(user = { id: 1 }, params = { tenantId: "1" }) {
  return { user, params };
}

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("dataAnonymization.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when tenantId is missing", async () => {
    const req = createReq({ id: 1 }, {});
    const res = createRes();
    await dataAnonymizationController.anonymizeTenantHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "tenantId is required",
    });
  });

  it("returns 400 when tenantId is 0", async () => {
    const req = createReq({ id: 1 }, { tenantId: "0" });
    const res = createRes();
    await dataAnonymizationController.anonymizeTenantHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "tenantId is required",
    });
  });

  it("returns 200 and anonymizes tenant", async () => {
    dataAnonymizationDAO.anonymizeTenant.mockResolvedValue({ success: true });
    const req = createReq({ id: 1 }, { tenantId: "42" });
    const res = createRes();
    await dataAnonymizationController.anonymizeTenantHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, success: true });
    expect(dataAnonymizationDAO.anonymizeTenant).toHaveBeenCalledWith(42, 1);
  });
});
