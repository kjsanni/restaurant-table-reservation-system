"use strict";

const guestListDAO = require("../DAOs/guestList.dao");
const ticketTypeDAO = require("../DAOs/ticketType.dao");
const qrCodeDAO = require("../DAOs/qrCode.dao");
const qrCodeService = require("./qrCode.service");
const crypto = require("crypto");

const guestListService = {};

guestListService.getGuestList = async (eventId, tenantId, filters = {}) => {
  return guestListDAO.list(eventId, tenantId, filters);
};

guestListService.addGuest = async (eventId, data, tenantId) => {
  return guestListDAO.create({
    ...data,
    eventId,
    tenantId,
  });
};

guestListService.updateGuest = async (eventId, guestId, data, tenantId) => {
  return guestListDAO.update(guestId, eventId, tenantId, data);
};

guestListService.removeGuest = async (eventId, guestId, tenantId) => {
  return guestListDAO.delete(guestId, eventId, tenantId);
};

guestListService.generateQRCodeForGuest = async (eventId, guestId, tenantId) => {
  const guest = await guestListDAO.findById(guestId, eventId, tenantId);
  if (!guest) {
    throw new Error("Guest not found");
  }

  const generated = await qrCodeService.generateQRCode(eventId, {
    attendeeName: guest.fullName || `${guest.firstName || ""} ${guest.lastName || ""}`.trim() || null,
    seat: guest.seat || null,
    tier: guest.tier || null,
    ticketType: guest.ticketType || null,
    guestListId: guestId,
    maxUses: 1,
    validFrom: guest.validFrom || null,
    expiresAt: guest.expiresAt || null,
  }, tenantId);

  await guestListDAO.update(guestId, eventId, tenantId, { qrCodeId: generated.id });

  return generated;
};

module.exports = guestListService;
