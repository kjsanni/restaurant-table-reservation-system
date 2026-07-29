const promotionService = require("../services/promotion.service");

const getPromotionsHandler = async (req, res) => {
  try {
    const now = new Date();
    const result = await promotionService.listPromotions(req.tenant?.id, {
      isActive: true,
    });
    const active = (result.promotions || []).filter((p) => {
      if (!p.validFrom || !p.validUntil) return true;
      const from = new Date(p.validFrom);
      const until = new Date(p.validUntil);
      return now >= from && now <= until;
    });
    return res.status(200).json({ success: true, promotions: active });
  } catch (err) {
    console.error("getCustomerPromotionsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load promotions" });
  }
};

const getPromotionHandler = async (req, res) => {
  try {
    const promotion = await promotionService.getPromotion(req.params.promotionId, req.tenant?.id);
    if (!promotion || !promotion.isActive) {
      return res.status(404).json({ success: false, message: "Promotion not found" });
    }
    const now = new Date();
    if (promotion.validFrom && now < new Date(promotion.validFrom)) {
      return res.status(404).json({ success: false, message: "Promotion not yet active" });
    }
    if (promotion.validUntil && now > new Date(promotion.validUntil)) {
      return res.status(404).json({ success: false, message: "Promotion expired" });
    }
    return res.status(200).json({ success: true, promotion });
  } catch (err) {
    console.error("getCustomerPromotionHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load promotion" });
  }
};

module.exports = {
  getPromotionsHandler,
  getPromotionHandler,
};
