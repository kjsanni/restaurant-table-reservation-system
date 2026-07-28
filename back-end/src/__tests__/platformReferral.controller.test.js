const { listReferralsHandler, createReferralHandler, updateReferralHandler } = require("../tenant-platform/controllers/platformReferral.controller");

jest.mock("../tenant-platform/DAOs/platformReferral.dao", () => ({
  listReferrals: jest.fn(),
  createReferral: jest.fn(),
  updateReferral: jest.fn(),
}));

const platformReferralDAO = require("../tenant-platform/DAOs/platformReferral.dao");

function createReq(user = { id: 1 }, body = {}, params = {}) {
  return { user, body, params, ip: "127.0.0.1" };
}

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("platformReferral.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create accepts whitelisted fields and strips non-whitelisted fields", async () => {
    platformReferralDAO.createReferral.mockResolvedValue({ id: 1, status: "pending" });
    const req = createReq({ id: 1 }, { referrerTenantId: 5, referredTenantId: 10, status: "pending", rewardAmount: 100, maliciousField: "ignored" });
    const res = createRes();
    await createReferralHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(platformReferralDAO.createReferral).toHaveBeenCalledWith(
      expect.objectContaining({ referrerTenantId: 5, referredTenantId: 10, status: "pending", rewardAmount: 100 })
    );
    expect(platformReferralDAO.createReferral).toHaveBeenCalledWith(
      expect.not.objectContaining({ maliciousField: "ignored" })
    );
  });

  it("update accepts whitelisted fields and strips non-whitelisted fields", async () => {
    platformReferralDAO.updateReferral.mockResolvedValue({ id: 1, status: "converted" });
    const req = createReq({ id: 1 }, { status: "converted", rewardAmount: 200, maliciousField: "ignored" }, { id: "1" });
    const res = createRes();
    await updateReferralHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(platformReferralDAO.updateReferral).toHaveBeenCalledWith("1", expect.objectContaining({ status: "converted", rewardAmount: 200 }));
    expect(platformReferralDAO.updateReferral).toHaveBeenCalledWith("1", expect.not.objectContaining({ maliciousField: "ignored" }));
  });

  it("update returns 404 when not found", async () => {
    platformReferralDAO.updateReferral.mockResolvedValue(null);
    const req = createReq({ id: 1 }, { status: "converted" }, { id: "999" });
    const res = createRes();
    await updateReferralHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
