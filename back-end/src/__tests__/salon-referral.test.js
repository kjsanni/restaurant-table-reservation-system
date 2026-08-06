"use strict";

jest.mock("../verticals/salon/DAOs/referral.dao");
jest.mock("../middleware/auditLog", () => ({ logAction: jest.fn() }));

const referralController = require("../verticals/salon/controllers/referral.controller");
const { makeRes } = require("./utils/test-response");

describe("referral.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getReferrals returns data for tenant", async () => {
    require("../verticals/salon/DAOs/referral.dao").findAll.mockResolvedValue([
      { id: 1, code: "REF-123", status: "pending" },
    ]);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, query: {} };

    await referralController.getReferralsHandler(req, ref.res);

    expect(require("../verticals/salon/DAOs/referral.dao").findAll).toHaveBeenCalledWith(1, {});
    ref.expectJson({
      success: true,
      data: [{ id: 1, code: "REF-123", status: "pending" }],
    });
  });

  it("createReferral returns 201", async () => {
    require("../verticals/salon/DAOs/referral.dao").create.mockResolvedValue({
      id: 1,
      code: "REF-123",
      status: "pending",
    });

    const ref = makeRes();
    const req = {
      tenant: { id: 1 },
      body: { code: "REF-123", referrerCustomerId: 1, status: "pending" },
    };

    await referralController.createReferralHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(201);
    ref.expectJson({
      success: true,
      data: { id: 1, code: "REF-123", status: "pending" },
    });
  });

  it("getReferral returns 404 when not found", async () => {
    require("../verticals/salon/DAOs/referral.dao").findById.mockResolvedValue(null);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 } };

    await referralController.getReferralHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Referral not found" });
  });

  it("updateReferral returns 404 when DAO returns null", async () => {
    require("../verticals/salon/DAOs/referral.dao").update.mockResolvedValue(null);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 }, body: { status: "completed" } };

    await referralController.updateReferralHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Referral not found" });
  });

  it("deleteReferral returns 404 when DAO returns false", async () => {
    require("../verticals/salon/DAOs/referral.dao").delete.mockResolvedValue(false);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 } };

    await referralController.deleteReferralHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Referral not found" });
  });
});
