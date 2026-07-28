"use strict";

const { localizedResponse, localizedError } = require("../utils/localizedResponse");

describe("localizedResponse utility", () => {
  function makeRes() {
    const json = jest.fn();
    const status = jest.fn(function () { return { json: json }; });
    return { res: { status: status, json: json } };
  }

  it("localizedResponse returns 200 with localized message", () => {
    var ref = makeRes();
    var req = { user: { locale: "tw" } };

    localizedResponse(req, ref.res, 200, "common.notFound");

    expect(ref.res.status).toHaveBeenCalledWith(200);
    expect(ref.res.json).toHaveBeenCalledWith({
      success: true,
      message: "Nnhu",
    });
  });

  it("localizedResponse falls back to English", () => {
    var ref = makeRes();
    var req = { user: { locale: "unknown" } };

    localizedResponse(req, ref.res, 200, "common.notFound");

    expect(ref.res.json).toHaveBeenCalledWith({
      success: true,
      message: "Not found",
    });
  });

  it("localizedError returns 404 with localized message", () => {
    var ref = makeRes();
    var req = { user: { locale: "gaa" } };

    localizedError(req, ref.res, 404, "salon.appointmentNotFound");

    expect(ref.res.status).toHaveBeenCalledWith(404);
    expect(ref.res.json).toHaveBeenCalledWith({
      success: false,
      message: "Nhyiamu no nhu",
    });
  });

  it("localizedError falls back to English for unknown locale", () => {
    var ref = makeRes();
    var req = { user: { locale: "fr" } };

    localizedError(req, ref.res, 400, "common.validationError");

    expect(ref.res.status).toHaveBeenCalledWith(400);
    expect(ref.res.json).toHaveBeenCalledWith({
      success: false,
      message: "Validation failed",
    });
  });

  it("localizedError replaces placeholders", () => {
    var ref = makeRes();
    var req = { user: { locale: "en" } };

    localizedError(req, ref.res, 400, "salon.paystackRefundFailed", { error: "timeout" });

    expect(ref.res.json).toHaveBeenCalledWith({
      success: false,
      message: "Paystack refund failed: timeout",
    });
  });

  it("localizedResponse replaces placeholders", () => {
    var ref = makeRes();
    var req = { user: { locale: "tw" } };

    localizedResponse(req, ref.res, 201, "salon.commissionCreated", { id: 7 });

    expect(ref.res.json).toHaveBeenCalledWith({
      success: true,
      message: "Wɔbɔɔ commission a ne ID yɛ #7",
    });
  });
});
