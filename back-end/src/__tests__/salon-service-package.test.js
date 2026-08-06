"use strict";

jest.mock("../verticals/salon/DAOs/servicePackage.dao");
jest.mock("../middleware/auditLog", () => ({ logAction: jest.fn() }));

const servicePackageController = require("../verticals/salon/controllers/servicePackage.controller");
const { makeRes } = require("./utils/test-response");

describe("servicePackage.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getServicePackages returns data for tenant", async () => {
    require("../verticals/salon/DAOs/servicePackage.dao").findAll.mockResolvedValue([
      { id: 1, name: "Bronze", price: 199 },
    ]);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, query: {} };

    await servicePackageController.getServicePackagesHandler(req, ref.res);

    expect(require("../verticals/salon/DAOs/servicePackage.dao").findAll).toHaveBeenCalledWith(1, {});
    ref.expectJson({
      success: true,
      data: [{ id: 1, name: "Bronze", price: 199 }],
    });
  });

  it("createServicePackage returns 201", async () => {
    require("../verticals/salon/DAOs/servicePackage.dao").create.mockResolvedValue({
      id: 1,
      name: "Bronze",
      price: 199,
    });

    const ref = makeRes();
    const req = {
      tenant: { id: 1 },
      body: { name: "Bronze", price: 199, currency: "GHS" },
    };

    await servicePackageController.createServicePackageHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(201);
    ref.expectJson({
      success: true,
      data: { id: 1, name: "Bronze", price: 199 },
    });
  });

  it("getServicePackage returns 404 when not found", async () => {
    require("../verticals/salon/DAOs/servicePackage.dao").findById.mockResolvedValue(null);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 } };

    await servicePackageController.getServicePackageHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Package not found" });
  });

  it("updateServicePackage returns 404 when DAO returns null", async () => {
    require("../verticals/salon/DAOs/servicePackage.dao").update.mockResolvedValue(null);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 }, body: { price: 249 } };

    await servicePackageController.updateServicePackageHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Package not found" });
  });

  it("deleteServicePackage returns 404 when DAO returns false", async () => {
    require("../verticals/salon/DAOs/servicePackage.dao").delete.mockResolvedValue(false);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 } };

    await servicePackageController.deleteServicePackageHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Package not found" });
  });
});
