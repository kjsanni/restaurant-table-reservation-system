"use strict";

jest.mock("../verticals/event/DAOs/event.dao");
jest.mock("../verticals/event/DAOs/guestList.dao");
jest.mock("../verticals/event/DAOs/ticketType.dao");
jest.mock("../verticals/event/DAOs/qrCode.dao");

const eventDAO = require("../verticals/event/DAOs/event.dao");
const guestListDAO = require("../verticals/event/DAOs/guestList.dao");
const ticketTypeDAO = require("../verticals/event/DAOs/ticketType.dao");
const qrCodeDAO = require("../verticals/event/DAOs/qrCode.dao");

describe("Event DAOs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("event.dao", () => {
    it("create calls db.Event.create with tenantId", async () => {
      eventDAO.create.mockResolvedValue({ id: 1, name: "Test" });
      const result = await eventDAO.create({ name: "Test", tenantId: 1 });
      expect(eventDAO.create).toHaveBeenCalledWith({ name: "Test", tenantId: 1 });
      expect(result.id).toBe(1);
    });

    it("findById returns event scoped to tenant", async () => {
      eventDAO.findById.mockResolvedValue({ id: 1, name: "Test" });
      const result = await eventDAO.findById(1, 1);
      expect(eventDAO.findById).toHaveBeenCalledWith(1, 1);
      expect(result.name).toBe("Test");
    });

    it("list returns paginated results", async () => {
      eventDAO.list.mockResolvedValue({ rows: [], count: 0 });
      const result = await eventDAO.list(1, { status: "draft" });
      expect(eventDAO.list).toHaveBeenCalledWith(1, { status: "draft" });
      expect(result.count).toBe(0);
    });

    it("update modifies event", async () => {
      eventDAO.update.mockResolvedValue({ id: 1, status: "published" });
      const result = await eventDAO.update(1, 1, { status: "published" });
      expect(eventDAO.update).toHaveBeenCalledWith(1, 1, { status: "published" });
      expect(result.status).toBe("published");
    });

    it("delete removes event", async () => {
      eventDAO.delete.mockResolvedValue(true);
      const result = await eventDAO.delete(1, 1);
      expect(eventDAO.delete).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(true);
    });
  });

  describe("guestList.dao", () => {
    it("adds guest to event", async () => {
      guestListDAO.create.mockResolvedValue({ id: 1, guestName: "John" });
      await guestListDAO.create({ eventId: 1, guestName: "John", tenantId: 1 });
      expect(guestListDAO.create).toHaveBeenCalledWith({ eventId: 1, guestName: "John", tenantId: 1 });
    });

    it("lists guests with filters", async () => {
      guestListDAO.list.mockResolvedValue({ rows: [], count: 0 });
      await guestListDAO.list(1, 1, { status: "invited" });
      expect(guestListDAO.list).toHaveBeenCalledWith(1, 1, { status: "invited" });
    });
  });

  describe("ticketType.dao", () => {
    it("creates ticket type", async () => {
      ticketTypeDAO.create.mockResolvedValue({ id: 1, name: "VIP", price: "100.00" });
      const result = await ticketTypeDAO.create({ eventId: 1, name: "VIP", price: 100, tenantId: 1 });
      expect(ticketTypeDAO.create).toHaveBeenCalled();
      expect(result.price).toBe("100.00");
    });

    it("lists ticket types for event", async () => {
      ticketTypeDAO.list.mockResolvedValue([]);
      await ticketTypeDAO.list(1, 1);
      expect(ticketTypeDAO.list).toHaveBeenCalledWith(1, 1);
    });
  });

  describe("qrCode.dao", () => {
    it("generates QR code", async () => {
      qrCodeDAO.create.mockResolvedValue({ id: 1, code: "abc123", status: "active" });
      const result = await qrCodeDAO.create({ eventId: 1, code: "abc123", tenantId: 1, status: "active" });
      expect(qrCodeDAO.create).toHaveBeenCalled();
      expect(result.code).toBe("abc123");
    });

    it("finds QR code by code", async () => {
      qrCodeDAO.findByCode.mockResolvedValue({ id: 1, code: "abc123" });
      await qrCodeDAO.findByCode("abc123", 1);
      expect(qrCodeDAO.findByCode).toHaveBeenCalledWith("abc123", 1);
    });
  });
});
