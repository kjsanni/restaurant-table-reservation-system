"use strict";

jest.mock("../verticals/salon/DAOs/inventoryItem.dao");
jest.mock("../middleware/auditLog", () => ({ logAction: jest.fn() }));

const inventoryItemController = require("../verticals/salon/controllers/inventoryItem.controller");

describe("inventoryItem.controller", () => {
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

  it("getInventoryItems returns data for tenant", async () => {
    require("../verticals/salon/DAOs/inventoryItem.dao").findAll.mockResolvedValue([
      { id: 1, name: "Shampoo", quantity: 10 },
    ]);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, query: {} };

    await inventoryItemController.getInventoryItemsHandler(req, ref.res);

    expect(require("../verticals/salon/DAOs/inventoryItem.dao").findAll).toHaveBeenCalledWith(1, {});
    ref.expectJson({
      success: true,
      data: [{ id: 1, name: "Shampoo", quantity: 10 }],
    });
  });

  it("createInventoryItem returns 201", async () => {
    require("../verticals/salon/DAOs/inventoryItem.dao").create.mockResolvedValue({
      id: 1,
      name: "Shampoo",
      quantity: 10,
    });

    const ref = makeRes();
    const req = {
      tenant: { id: 1 },
      body: { name: "Shampoo", quantity: 10, currency: "GHS" },
    };

    await inventoryItemController.createInventoryItemHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(201);
    ref.expectJson({
      success: true,
      data: { id: 1, name: "Shampoo", quantity: 10 },
    });
  });

  it("getInventoryItem returns 404 when not found", async () => {
    require("../verticals/salon/DAOs/inventoryItem.dao").findById.mockResolvedValue(null);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 } };

    await inventoryItemController.getInventoryItemHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Inventory item not found" });
  });

  it("updateInventoryItem returns 404 when DAO returns null", async () => {
    require("../verticals/salon/DAOs/inventoryItem.dao").update.mockResolvedValue(null);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 }, body: { quantity: 5 } };

    await inventoryItemController.updateInventoryItemHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Inventory item not found" });
  });

  it("deleteInventoryItem returns 404 when DAO returns false", async () => {
    require("../verticals/salon/DAOs/inventoryItem.dao").delete.mockResolvedValue(false);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 } };

    await inventoryItemController.deleteInventoryItemHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Inventory item not found" });
  });

  it("getLowStock returns items below reorder level", async () => {
    require("../verticals/salon/DAOs/inventoryItem.dao").findLowStock.mockResolvedValue([
      { id: 1, name: "Shampoo", quantity: 2, reorderLevel: 5 },
    ]);

    const ref = makeRes();
    const req = { tenant: { id: 1 } };

    await inventoryItemController.getLowStockHandler(req, ref.res);

    expect(require("../verticals/salon/DAOs/inventoryItem.dao").findLowStock).toHaveBeenCalledWith(1);
    ref.expectJson({
      success: true,
      data: [{ id: 1, name: "Shampoo", quantity: 2, reorderLevel: 5 }],
    });
  });
});
