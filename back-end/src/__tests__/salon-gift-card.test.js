"use strict";

jest.mock("../verticals/salon/DAOs/giftCard.dao");
jest.mock("../middleware/auditLog", () => ({ logAction: jest.fn() }));

const giftCardController = require("../verticals/salon/controllers/giftCard.controller");
const { makeRes } = require("./utils/test-response");

describe("giftCard.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getGiftCards returns data for tenant", async () => {
    require("../verticals/salon/DAOs/giftCard.dao").findAll.mockResolvedValue([
      { id: 1, code: "GIFT-123", balance: 100 },
    ]);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, query: {} };

    await giftCardController.getGiftCardsHandler(req, ref.res);

    expect(require("../verticals/salon/DAOs/giftCard.dao").findAll).toHaveBeenCalledWith(1, {});
    ref.expectJson({
      success: true,
      data: [{ id: 1, code: "GIFT-123", balance: 100 }],
    });
  });

  it("createGiftCard returns 201", async () => {
    require("../verticals/salon/DAOs/giftCard.dao").create.mockResolvedValue({
      id: 1,
      code: "GIFT-123",
      amount: 100,
      balance: 100,
    });

    const ref = makeRes();
    const req = {
      tenant: { id: 1 },
      body: { code: "GIFT-123", amount: 100, balance: 100, currency: "GHS", status: "active" },
    };

    await giftCardController.createGiftCardHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(201);
    ref.expectJson({
      success: true,
      data: { id: 1, code: "GIFT-123", amount: 100, balance: 100 },
    });
  });

  it("getGiftCard returns 404 when not found", async () => {
    require("../verticals/salon/DAOs/giftCard.dao").findById.mockResolvedValue(null);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 } };

    await giftCardController.getGiftCardHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Gift card not found" });
  });

  it("updateGiftCard returns 404 when DAO returns null", async () => {
    require("../verticals/salon/DAOs/giftCard.dao").update.mockResolvedValue(null);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 }, body: { balance: 50 } };

    await giftCardController.updateGiftCardHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Gift card not found" });
  });

  it("deleteGiftCard returns 404 when DAO returns false", async () => {
    require("../verticals/salon/DAOs/giftCard.dao").delete.mockResolvedValue(false);

    const ref = makeRes();
    const req = { tenant: { id: 1 }, params: { id: 999 } };

    await giftCardController.deleteGiftCardHandler(req, ref.res);

    expect(ref.res.status).toHaveBeenCalledWith(404);
    ref.expectJson({ success: false, message: "Gift card not found" });
  });
});
