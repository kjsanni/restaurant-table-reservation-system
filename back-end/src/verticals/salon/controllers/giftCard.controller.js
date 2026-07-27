"use strict";

const giftCardDao = require("../DAOs/giftCard.dao");

const createGiftCardHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const data = req.body;
    const giftCard = await giftCardDao.create(data, tenantId);
    return res.status(201).json({ success: true, data: giftCard });
  } catch (err) {
    console.error("createGiftCardHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to create gift card" });
  }
};

const getGiftCardsHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { status, search } = req.query;
    const cards = await giftCardDao.findAll(tenantId, { status, search });
    return res.status(200).json({ success: true, data: cards });
  } catch (err) {
    console.error("getGiftCardsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load gift cards" });
  }
};

const getGiftCardHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const card = await giftCardDao.findById(id, tenantId);
    if (!card) {
      return res.status(404).json({ success: false, message: "Gift card not found" });
    }
    return res.status(200).json({ success: true, data: card });
  } catch (err) {
    console.error("getGiftCardHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load gift card" });
  }
};

const updateGiftCardHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const updated = await giftCardDao.update(id, tenantId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Gift card not found" });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("updateGiftCardHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update gift card" });
  }
};

const deleteGiftCardHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const removed = await giftCardDao.delete(id, tenantId);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Gift card not found" });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("deleteGiftCardHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete gift card" });
  }
};

module.exports = {
  createGiftCardHandler,
  getGiftCardsHandler,
  getGiftCardHandler,
  updateGiftCardHandler,
  deleteGiftCardHandler,
};
