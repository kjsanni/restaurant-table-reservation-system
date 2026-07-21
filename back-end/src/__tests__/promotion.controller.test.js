const promotionController = require("../controllers/promotion.controller");
const promotionDAO = require("../DAOs/promotion.dao");

jest.mock("../DAOs/promotion.dao");

describe("promotion.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { tenant: { id: 1 }, user: { id: 1 }, params: {}, query: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe("createPromotionHandler", () => {
    it("should create a promotion", async () => {
      promotionDAO.createPromotion.mockResolvedValue({ id: 1, code: "TEST20" });
      req.body = { code: "TEST20", discountType: "percentage", discountValue: 20 };

      await promotionController.createPromotionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, promotion: { id: 1, code: "TEST20" } });
    });
  });

  describe("getPromotionHandler", () => {
    it("should return 404 when not found", async () => {
      promotionDAO.getPromotionById.mockResolvedValue(null);

      await promotionController.getPromotionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return promotion when found", async () => {
      promotionDAO.getPromotionById.mockResolvedValue({ id: 1, code: "TEST20" });

      await promotionController.getPromotionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getPromotionsHandler", () => {
    it("should return list of promotions", async () => {
      promotionDAO.getAllPromotions.mockResolvedValue({ promotions: [], total: 0 });

      await promotionController.getPromotionsHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, collection: [] });
    });

    it("should apply filters", async () => {
      promotionDAO.getAllPromotions.mockResolvedValue({ promotions: [], total: 0 });
      req.query = { isActive: "true", discountType: "percentage", code: "TEST" };

      await promotionController.getPromotionsHandler(req, res);
      expect(promotionDAO.getAllPromotions).toHaveBeenCalledWith(
        1,
        { isActive: true, discountType: "percentage", code: "TEST" },
        {}
      );
    });
  });

  describe("updatePromotionHandler", () => {
    it("should update a promotion", async () => {
      promotionDAO.updatePromotion.mockResolvedValue({ id: 1, code: "TEST20", discountValue: 30 });
      req.params = { promotionId: "1" };
      req.body = { discountValue: 30 };

      await promotionController.updatePromotionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(promotionDAO.updatePromotion).toHaveBeenCalledWith("1", 1, { discountValue: 30 });
    });

    it("should return 404 when not found", async () => {
      promotionDAO.updatePromotion.mockResolvedValue(null);
      req.params = { promotionId: "999" };
      req.body = { discountValue: 30 };

      await promotionController.updatePromotionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deletePromotionHandler", () => {
    it("should delete a promotion", async () => {
      promotionDAO.deletePromotion.mockResolvedValue(true);
      req.params = { promotionId: "1" };

      await promotionController.deletePromotionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 when not found", async () => {
      promotionDAO.deletePromotion.mockResolvedValue(null);
      req.params = { promotionId: "999" };

      await promotionController.deletePromotionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("validatePromotionHandler", () => {
    it("should validate a promotion code", async () => {
      promotionDAO.validatePromotion.mockResolvedValue({ valid: true, discountAmount: 10 });
      req.body = { code: "TEST20", orderTotal: 100 };

      await promotionController.validatePromotionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, valid: true, discountAmount: 10 });
    });

    it("should return 400 for missing fields", async () => {
      req.body = { code: "TEST20" };

      await promotionController.validatePromotionHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
