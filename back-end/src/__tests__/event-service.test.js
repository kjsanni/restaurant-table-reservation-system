"use strict";

jest.mock("../db/models");
jest.mock("../utils/cache");
jest.mock("../verticals/event/DAOs/event.dao", () => ({
  list: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));
jest.mock("../verticals/event/DAOs/guestList.dao", () => ({
  list: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteByEventId: jest.fn(),
}));
jest.mock("../verticals/event/DAOs/ticketType.dao", () => ({
  list: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteByEventId: jest.fn(),
}));
jest.mock("../verticals/event/DAOs/qrCode.dao", () => ({
  list: jest.fn(),
  create: jest.fn(),
  findByCode: jest.fn(),
  findByTokenHash: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteByEventId: jest.fn(),
  markUsedAtomic: jest.fn(),
  findById: jest.fn(),
  findByGuestListId: jest.fn(),
  hashToken: jest.fn().mockReturnValue("b".repeat(64)),
  generateRawToken: jest.fn().mockReturnValue("a".repeat(64)),
}));
jest.mock("../verticals/event/DAOs/eventBooking.dao", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  list: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  countConfirmedByEvent: jest.fn(),
}));

const db = require("../db/models");
const cache = require("../utils/cache");
const eventDAO = require("../verticals/event/DAOs/event.dao");
const guestListDAO = require("../verticals/event/DAOs/guestList.dao");
const ticketTypeDAO = require("../verticals/event/DAOs/ticketType.dao");
const qrCodeDAO = require("../verticals/event/DAOs/qrCode.dao");
const eventBookingDAO = require("../verticals/event/DAOs/eventBooking.dao");

const eventService = require("../verticals/event/services/event.service");
const guestListService = require("../verticals/event/services/guestList.service");
const ticketTypeService = require("../verticals/event/services/ticketType.service");
const qrCodeService = require("../verticals/event/services/qrCode.service");
const eventBookingService = require("../verticals/event/services/eventBooking.service");

describe("Event Service Layer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.setting = { findOne: jest.fn().mockResolvedValue(null) };
    db.AuditLog = { create: jest.fn().mockResolvedValue({}) };
    db.QRCode = { findOne: jest.fn().mockResolvedValue(null) };
    db.Event = { findOne: jest.fn().mockResolvedValue(null) };
    cache.get = jest.fn().mockResolvedValue(null);
    cache.set = jest.fn().mockResolvedValue(true);
    qrCodeDAO.hashToken = jest.fn().mockReturnValue("b".repeat(64));
  });

  describe("event.service", () => {
    it("getEvents returns paginated list", async () => {
      eventDAO.list.mockResolvedValue({ rows: [], count: 0 });
      const result = await eventService.getEvents(1, { status: "published" });
      expect(eventDAO.list).toHaveBeenCalledWith(1, { status: "published" });
      expect(result.count).toBe(0);
    });

    it("createEvent requires name and date", async () => {
      await expect(eventService.createEvent({}, 1, 1)).rejects.toThrow("Event name and date are required");
    });

    it("deleteEvent cascades to related records", async () => {
      eventDAO.findById.mockResolvedValue({ id: 1, tenantId: 1 });
      eventDAO.delete.mockResolvedValue(true);
      guestListDAO.deleteByEventId.mockResolvedValue(true);
      ticketTypeDAO.deleteByEventId.mockResolvedValue(true);
      qrCodeDAO.deleteByEventId.mockResolvedValue(true);

      const result = await eventService.deleteEvent(1, 1);
      expect(guestListDAO.deleteByEventId).toHaveBeenCalledWith(1, 1);
      expect(ticketTypeDAO.deleteByEventId).toHaveBeenCalledWith(1, 1);
      expect(qrCodeDAO.deleteByEventId).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(true);
    });
  });

  describe("guestList.service", () => {
    it("addGuest creates guest record", async () => {
      guestListDAO.create.mockResolvedValue({ id: 1, guestName: "Test" });
      const result = await guestListService.addGuest(1, { guestName: "Test" }, 1);
      expect(guestListDAO.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 1,
          tenantId: 1,
          guestName: "Test",
        })
      );
      expect(result.guestName).toBe("Test");
    });

    it("generateQRCodeForGuest creates QR and links to guest", async () => {
      guestListDAO.findById.mockResolvedValue({ id: 1, eventId: 1, tenantId: 1 });
      qrCodeDAO.findByGuestListId.mockResolvedValue(null);
      qrCodeDAO.create.mockResolvedValue({
        record: { id: 42, code: "abc123" },
        rawToken: "a".repeat(64),
        tokenHash: "b".repeat(64),
      });
      guestListDAO.update.mockResolvedValue(true);

      await guestListService.generateQRCodeForGuest(1, 1, 1);
      expect(qrCodeDAO.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 1,
          guestListId: 1,
          tenantId: 1,
        })
      );
      expect(guestListDAO.update).toHaveBeenCalledWith(1, 1, 1, { qrCodeId: 42 });
    });
  });

  describe("ticketType.service", () => {
    it("createTicketType creates ticket type", async () => {
      ticketTypeDAO.create.mockResolvedValue({ id: 1, name: "VIP" });
      const result = await ticketTypeService.createTicketType(1, { name: "VIP", price: 100 }, 1);
      expect(ticketTypeDAO.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 1,
          tenantId: 1,
          name: "VIP",
          price: 100,
        })
      );
      expect(result.name).toBe("VIP");
    });

    it("updateTicketType returns null when not found", async () => {
      ticketTypeDAO.update.mockResolvedValue(null);
      const result = await ticketTypeService.updateTicketType(1, 1, { name: "VIP" }, 1);
      expect(result).toBeNull();
    });
  });

  describe("qrCode.service", () => {
    it("generateQRCode creates code with optional guest link", async () => {
      qrCodeDAO.create.mockResolvedValue({
        record: { id: 1, code: "abc123", attendeeName: null, seat: null, tier: null },
        rawToken: "a".repeat(64),
        tokenHash: "b".repeat(64),
      });
      const result = await qrCodeService.generateQRCode(1, { guestListId: 5 }, 1);
      expect(qrCodeDAO.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 1,
          tenantId: 1,
          guestListId: 5,
        })
      );
      expect(result.rawToken).toBeDefined();
      expect(result.qrPayload).toBeDefined();
      expect(result.qrPayload.payload.t).toBe("b".repeat(64));
    });

    it("checkin rejects invalid token format", async () => {
      const result = await qrCodeService.checkin("short", 1, 1, {});
      expect(result.valid).toBe(false);
      expect(result.error).toBe("INVALID_TOKEN");
    });

    it("checkin verifies HMAC signature before DB lookup", async () => {
      db.setting.findOne.mockResolvedValue({ value: "test-secret" });
      const rawToken = "a".repeat(64);
      cache.get.mockResolvedValue(null);
      qrCodeDAO.markUsedAtomic.mockResolvedValue(null);

      const result = await qrCodeService.checkin(rawToken, 1, 1, { signature: "invalid-sig" });
      expect(result.valid).toBe(false);
      expect(result.error).toBe("INVALID_SIGNATURE");
      expect(qrCodeDAO.markUsedAtomic).not.toHaveBeenCalled();
    });
  });

  describe("eventBooking.service", () => {
    it("createBooking enforces ticket capacity", async () => {
      eventDAO.findById.mockResolvedValue({ id: 1, tenantId: 1, capacity: 100 });
      ticketTypeDAO.findById.mockResolvedValue({ id: 1, eventId: 1, tenantId: 1, price: 50, quantity: 100, soldCount: 5, isActive: true });
      eventBookingDAO.countConfirmedByEvent.mockResolvedValue(90);

      await expect(
        eventBookingService.createBooking({ eventId: 1, ticketTypeId: 1, quantity: 20 }, 1, 1)
      ).rejects.toThrow("Event capacity reached");
    });
  });
});
