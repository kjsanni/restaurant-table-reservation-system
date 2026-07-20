const promotionService = require("../services/promotion.service");

const createPromotionHandler = async (req, res) => {
  const promotion = await promotionService.createPromotion(req.tenant?.id, req.body, req.user?.id);
  return res.status(201).json({ success: true, promotion });
};

const getPromotionHandler = async (req, res) => {
  const promotion = await promotionService.getPromotion(req.params.promotionId, req.tenant?.id);
  if (!promotion) {
    return res.status(404).json({ success: false, message: "Promotion not found" });
  }
  return res.status(200).json({ success: true, promotion });
};

const getPromotionsHandler = async (req, res) => {
  const filters = {};
  if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === "true";
  if (req.query.discountType) filters.discountType = req.query.discountType;
  if (req.query.code) filters.code = req.query.code;

  const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined;
  const pagination = {};
  if (page && pageSize) {
    pagination.limit = pageSize;
    pagination.offset = (page - 1) * pageSize;
  }

  const result = await promotionService.listPromotions(req.tenant?.id, filters, pagination);
  const response = { success: true };
  if (pagination.limit) {
    response.collection = result.promotions;
    response.total = result.total;
    response.page = page;
    response.pageSize = pageSize;
  } else {
    response.collection = result.promotions;
  }
  return res.status(200).json(response);
};

const updatePromotionHandler = async (req, res) => {
  const allowed = ["description", "discountType", "discountValue", "minOrderAmount", "maxDiscountAmount", "usageLimit", "isActive", "validFrom", "validUntil"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }

  const promotion = await promotionService.updatePromotion(req.params.promotionId, req.tenant?.id, updates);
  if (!promotion) {
    return res.status(404).json({ success: false, message: "Promotion not found" });
  }
  return res.status(200).json({ success: true, promotion });
};

const deletePromotionHandler = async (req, res) => {
  const result = await promotionService.deletePromotion(req.params.promotionId, req.tenant?.id);
  if (!result) {
    return res.status(404).json({ success: false, message: "Promotion not found" });
  }
  return res.status(200).json({ success: true, message: "Promotion deleted" });
};

const validatePromotionHandler = async (req, res) => {
  const { code, orderTotal } = req.body;
  if (!code || orderTotal === undefined) {
    return res.status(400).json({ success: false, message: "Code and orderTotal are required" });
  }

  try {
    const result = await promotionService.validatePromotionCode(code, orderTotal, req.tenant?.id);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
};

module.exports = {
  createPromotionHandler,
  getPromotionHandler,
  getPromotionsHandler,
  updatePromotionHandler,
  deletePromotionHandler,
  validatePromotionHandler,
};
