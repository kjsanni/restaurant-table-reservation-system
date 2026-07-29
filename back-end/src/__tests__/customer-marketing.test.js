const customerMarketingController = require("../controllers/customer-marketing.controller");

jest.mock("../services/promotion.service");

const promotionService = require("../services/promotion.service");

describe("Customer marketing", () => {
  beforeEach(() => jest.clearAllMocks());

  it("getPromotionsHandler returns active promotions", async () => {
    const req = { tenant: { id: 1 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    promotionService.listPromotions.mockResolvedValue({
      promotions: [
        { id: 1, isActive: true, validFrom: "2026-01-01", validUntil: "2026-12-31" },
        { id: 2, isActive: true, validFrom: null, validUntil: null },
      ],
    });

    await customerMarketingController.getPromotionsHandler(req, res);
    expect(promotionService.listPromotions).toHaveBeenCalledWith(1, { isActive: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      promotions: [
        { id: 1, isActive: true, validFrom: "2026-01-01", validUntil: "2026-12-31" },
        { id: 2, isActive: true, validFrom: null, validUntil: null },
      ],
    });
  });

  it("getPromotionsHandler filters expired promotions", async () => {
    const req = { tenant: { id: 1 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    promotionService.listPromotions.mockResolvedValue({
      promotions: [
        { id: 1, isActive: true, validFrom: "2026-01-01", validUntil: "2026-12-31" },
        { id: 2, isActive: true, validFrom: "2026-01-01", validUntil: "2026-01-02" },
      ],
    });

    await customerMarketingController.getPromotionsHandler(req, res);
    const body = res.json.mock.calls[0][0];
    expect(body.promotions).toHaveLength(1);
    expect(body.promotions[0].id).toBe(1);
  });

  it("getPromotionHandler returns active promotion", async () => {
    const req = { tenant: { id: 1 }, params: { promotionId: 1 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    promotionService.getPromotion.mockResolvedValue({ id: 1, isActive: true });

    await customerMarketingController.getPromotionHandler(req, res);
    expect(promotionService.getPromotion).toHaveBeenCalledWith(1, 1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("getPromotionHandler returns 404 for inactive promotion", async () => {
    const req = { tenant: { id: 1 }, params: { promotionId: 1 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    promotionService.getPromotion.mockResolvedValue({ id: 1, isActive: false });

    await customerMarketingController.getPromotionHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("getPromotionHandler returns 404 for missing promotion", async () => {
    const req = { tenant: { id: 1 }, params: { promotionId: 999 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    promotionService.getPromotion.mockResolvedValue(null);

    await customerMarketingController.getPromotionHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
