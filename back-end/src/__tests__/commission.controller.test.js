"use strict";

jest.mock("../verticals/salon/DAOs/commission.dao");
jest.mock("../middleware/auditLog", () => ({ logAction: jest.fn() }));

const commissionController = require("../verticals/salon/controllers/commission.controller");

describe("commission.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    const json = jest.fn();
    const status = jest.fn(function () { return { json: json }; });
    return { res: { status: status, json: json }, expectJson: function (expected) {
      expect(json).toHaveBeenCalledWith(expected);
    } };
  }

  it("getAllCommissions passes tenantId to DAO and returns data", async () => {
    require("../verticals/salon/DAOs/commission.dao").findAllForTenant.mockResolvedValue({
      total: 2,
      data: [{ id: 1 }, { id: 2 }],
    });

    var ref = makeRes();
    var req = { tenant: { id: 1 }, query: {} };

    await commissionController.getAllCommissions(req, ref.res);

    expect(require("../verticals/salon/DAOs/commission.dao").findAllForTenant).toHaveBeenCalledWith(1, {});
    ref.expectJson({ success: true, total: 2, data: [{ id: 1 }, { id: 2 }] });
  });

  it("createCommission returns 201 and logs audit entry", async () => {
    require("../verticals/salon/DAOs/commission.dao").createCommission.mockResolvedValue({
      id: 1,
      userId: 5,
      amount: 50,
    });

    var ref = makeRes();
    var req = {
      tenant: { id: 1 },
      body: { userId: 5, amount: 50, rateType: "percentage", rateValue: 10 },
    };

    await commissionController.createCommission(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(201);
    ref.expectJson({
      success: true,
      data: { id: 1, userId: 5, amount: 50 },
    });
  });

  it("getCommission returns 404 json when DAO returns null", async () => {
    require("../verticals/salon/DAOs/commission.dao").findById.mockResolvedValue(null);

    var ref = makeRes();
    var req = { tenant: { id: 1 }, params: { id: 999 } };

    await commissionController.getCommission(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Commission not found" });
  });

  it("markCommissionPaid returns 404 when commission missing", async () => {
    require("../verticals/salon/DAOs/commission.dao").markAsPaid.mockResolvedValue(null);

    var ref = makeRes();
    var req = { tenant: { id: 1 }, params: { id: 999 } };

    await commissionController.markCommissionPaid(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Commission not found or already paid" });
  });

  it("markCommissionPaid updates commission status to paid", async () => {
    require("../verticals/salon/DAOs/commission.dao").markAsPaid.mockResolvedValue({
      id: 1,
      status: "paid",
      paidAt: new Date(),
    });

    var ref = makeRes();
    var req = { tenant: { id: 1 }, params: { id: 1 } };

    await commissionController.markCommissionPaid(req, ref.res);

    expect(ref.res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: 1,
          status: "paid",
        }),
      })
    );
  });

  it("deleteCommission returns 404 when commission missing", async () => {
    require("../verticals/salon/DAOs/commission.dao").deleteCommission.mockResolvedValue(false);

    var ref = makeRes();
    var req = { tenant: { id: 1 }, params: { id: 999 } };

    await commissionController.deleteCommission(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Commission not found" });
  });
});
