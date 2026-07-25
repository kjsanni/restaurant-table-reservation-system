"use strict";

jest.mock("../verticals/salon/DAOs/location.dao");
jest.mock("../middleware/auditLog", () => ({ logAction: jest.fn() }));

const locationController = require("../verticals/salon/controllers/location.controller");

describe("location.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    const json = jest.fn();
    const status = jest.fn(function () {
      return { json: json };
    });
    return {
      res: { status: status, json: json },
      expectJson: function (expected) {
        expect(json).toHaveBeenCalledWith(expected);
      },
    };
  }

  it("getLocations returns data for tenant", async () => {
    require("../verticals/salon/DAOs/location.dao").findAll.mockResolvedValue([
      { id: 1, name: "Main", isPrimary: true },
    ]);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, query: {} };

    await locationController.getLocationsHandler(req, ref.res);

    expect(require("../verticals/salon/DAOs/location.dao").findAll).toHaveBeenCalledWith(1);
    ref.expectJson({
      success: true,
      data: [{ id: 1, name: "Main", isPrimary: true }],
    });
  });

  it("createLocation returns 201", async () => {
    require("../verticals/salon/DAOs/location.dao").create.mockResolvedValue({
      id: 1,
      name: "Branch",
      isPrimary: false,
    });

    const ref = makeRes();
    const req = {
      tenant: { id: 1 },
      body: { name: "Branch", isPrimary: false },
    };

    await locationController.createLocationHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(201);
    ref.expectJson({
      success: true,
      data: { id: 1, name: "Branch", isPrimary: false },
    });
  });

  it("getLocation returns 404 when not found", async () => {
    require("../verticals/salon/DAOs/location.dao").findById.mockResolvedValue(null);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 } };

    await locationController.getLocationHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Location not found" });
  });

  it("updateLocation returns 404 when DAO returns null", async () => {
    require("../verticals/salon/DAOs/location.dao").update.mockResolvedValue(null);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 }, body: { name: "New" } };

    await locationController.updateLocationHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Location not found" });
  });

  it("deleteLocation returns 404 when DAO returns false", async () => {
    require("../verticals/salon/DAOs/location.dao").delete.mockResolvedValue(false);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 } };

    await locationController.deleteLocationHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Location not found" });
  });
});
