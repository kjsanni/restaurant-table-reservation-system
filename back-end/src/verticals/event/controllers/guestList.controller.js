"use strict";

const guestListService = require("../services/guestList.service");

const getGuestListHandler = async (req, res) => {
  const result = await guestListService.getGuestList(req.params.eventId, req.tenant?.id, req.query);
  res.status(200).json(result);
};

const addGuestHandler = async (req, res) => {
  const guest = await guestListService.addGuest(req.params.eventId, req.body, req.tenant?.id);
  res.status(201).json({ success: true, item: guest });
};

const updateGuestHandler = async (req, res) => {
  const guest = await guestListService.updateGuest(req.params.eventId, req.params.guestId, req.body, req.tenant?.id);
  if (!guest) {
    return res.status(404).json({ success: false, message: "Guest not found" });
  }
  res.status(200).json({ success: true, item: guest });
};

const removeGuestHandler = async (req, res) => {
  const deleted = await guestListService.removeGuest(req.params.eventId, req.params.guestId, req.tenant?.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Guest not found" });
  }
  res.status(200).json({ success: true, message: "Guest removed" });
};

const generateGuestQRCodeHandler = async (req, res) => {
  const qrCode = await guestListService.generateQRCodeForGuest(req.params.eventId, req.params.guestId, req.tenant?.id);
  res.status(201).json({ success: true, item: qrCode });
};

module.exports = {
  getGuestListHandler,
  addGuestHandler,
  updateGuestHandler,
  removeGuestHandler,
  generateGuestQRCodeHandler,
};
