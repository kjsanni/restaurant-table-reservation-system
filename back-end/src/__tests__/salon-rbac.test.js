"use strict";

const { requireVertical } = require("../middleware/requireVertical");

describe("requireVertical middleware", () => {
  it("allows requests from matching vertical tenants", async () => {
    const req = {
      tenant: { businessVertical: "salon" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    requireVertical("salon")(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("blocks restaurant tenants from salon routes with 404", async () => {
    const req = {
      tenant: { businessVertical: "restaurant" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    requireVertical("salon")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Not available for this tenant" });
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks tenants without businessVertical from salon routes with 404", async () => {
    const req = {
      tenant: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    requireVertical("salon")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });
});
