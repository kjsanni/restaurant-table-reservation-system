const promotionDAO = require("../DAOs/promotion.dao");

const createPromotion = async (tenantId, data, userId) => {
  return await promotionDAO.createPromotion(tenantId, data, userId);
};

const getPromotion = async (promotionId, tenantId) => {
  return await promotionDAO.getPromotionById(promotionId, tenantId);
};

const listPromotions = async (tenantId, filters = {}, pagination = {}) => {
  return await promotionDAO.getAllPromotions(tenantId, filters, pagination);
};

const updatePromotion = async (promotionId, tenantId, data) => {
  return await promotionDAO.updatePromotion(promotionId, tenantId, data);
};

const deletePromotion = async (promotionId, tenantId) => {
  return await promotionDAO.deletePromotion(promotionId, tenantId);
};

const validatePromotionCode = async (code, orderTotal, tenantId) => {
  return await promotionDAO.validatePromotion(code, orderTotal, tenantId);
};

const applyPromotion = async (code, orderTotal, tenantId) => {
  const validation = await promotionDAO.validatePromotion(code, orderTotal, tenantId);
  if (!validation.valid) {
    throw { status: 400, message: validation.reason };
  }

  await promotionDAO.incrementUsage(validation.promotion.id, tenantId);

  return {
    promotion: validation.promotion,
    discountAmount: validation.discountAmount,
  };
};

module.exports = {
  createPromotion,
  getPromotion,
  listPromotions,
  updatePromotion,
  deletePromotion,
  validatePromotionCode,
  applyPromotion,
};
