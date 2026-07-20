const db = require("../db/models");
const Promotion = db.promotion;
const { Op } = db.Sequelize;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const createPromotion = async (tenantId, data, userId) => {
  const promotion = await Promotion.create({
    ...withTenant({}, tenantId),
    ...data,
    createdBy: userId || null,
  });
  return promotion;
};

const getPromotionById = async (id, tenantId) => {
  return await Promotion.findOne({
    where: withTenant({ id }, tenantId),
  });
};

const getPromotionByCode = async (code, tenantId) => {
  return await Promotion.findOne({
    where: withTenant({ code: code.toUpperCase() }, tenantId),
  });
};

const getAllPromotions = async (tenantId, filters = {}, pagination = {}) => {
  const where = withTenant({}, tenantId);
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.discountType) where.discountType = filters.discountType;
  if (filters.code) where.code = { [Op.like]: `%${filters.code}%` };

  const opts = {
    where,
    order: [["createdAt", "DESC"]],
  };

  if (pagination.limit) opts.limit = pagination.limit;
  if (pagination.offset !== undefined) opts.offset = pagination.offset;

  const { rows, count } = await Promotion.findAndCountAll(opts);
  return { promotions: rows, total: count };
};

const updatePromotion = async (id, tenantId, data) => {
  const promotion = await Promotion.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!promotion) return null;
  return await promotion.update(data);
};

const deletePromotion = async (id, tenantId) => {
  const promotion = await Promotion.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!promotion) return null;
  await promotion.destroy();
  return true;
};

const incrementUsage = async (id, tenantId) => {
  const promotion = await Promotion.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!promotion) return null;
  promotion.usedCount = (promotion.usedCount || 0) + 1;
  await promotion.save();
  return promotion;
};

const validatePromotion = async (code, orderTotal, tenantId) => {
  const promotion = await getPromotionByCode(code, tenantId);
  if (!promotion) {
    return { valid: false, reason: "Promotion code not found" };
  }

  if (!promotion.isActive) {
    return { valid: false, reason: "Promotion is not active" };
  }

  const now = new Date();
  if (promotion.validFrom && now < new Date(promotion.validFrom)) {
    return { valid: false, reason: "Promotion not yet valid" };
  }
  if (promotion.validUntil && now > new Date(promotion.validUntil)) {
    return { valid: false, reason: "Promotion expired" };
  }

  if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
    return { valid: false, reason: "Promotion usage limit reached" };
  }

  if (promotion.minOrderAmount && parseFloat(orderTotal) < parseFloat(promotion.minOrderAmount)) {
    return { valid: false, reason: `Minimum order amount is ${promotion.minOrderAmount}` };
  }

  let discountAmount = 0;
  if (promotion.discountType === "percentage") {
    discountAmount = (parseFloat(orderTotal) * parseFloat(promotion.discountValue)) / 100;
  } else {
    discountAmount = parseFloat(promotion.discountValue);
  }

  if (promotion.maxDiscountAmount && discountAmount > parseFloat(promotion.maxDiscountAmount)) {
    discountAmount = parseFloat(promotion.maxDiscountAmount);
  }

  return {
    valid: true,
    promotion,
    discountAmount: Math.round(discountAmount * 100) / 100,
  };
};

module.exports = {
  createPromotion,
  getPromotionById,
  getPromotionByCode,
  getAllPromotions,
  updatePromotion,
  deletePromotion,
  incrementUsage,
  validatePromotion,
};
