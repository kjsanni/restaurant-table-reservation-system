"use strict";

const { createRes } = require("./utils/test-response");

jest.mock("../verticals/event/services/event.service");
jest.mock("../verticals/event/services/guestList.service");
jest.mock("../verticals/event/services/ticketType.service");
jest.mock("../verticals/event/services/qrCode.service");
jest.mock("../verticals/event/services/eventBooking.service");
jest.mock("../tenant-platform/services/paystack.service");

jest.mock("../db/models", () => ({
  tenant: {
    findByPk: jest.fn(),
  },
}));

const eventService = require("../verticals/event/services/event.service");
const guestListService = require("../verticals/event/services/guestList.service");
const ticketTypeService = require("../verticals/event/services/ticketType.service");
const qrCodeService = require("../verticals/event/services/qrCode.service");
const eventBookingService = require("../verticals/event/services/eventBooking.service");
const paystackService = require("../tenant-platform/services/paystack.service");
const dbModels = require("../db/models");

const eventController = require("../verticals/event/controllers/event.controller");
const guestListController = require("../verticals/event/controllers/guestList.controller");
const ticketTypeController = require("../verticals/event/controllers/ticketType.controller");
const qrCodeController = require("../verticals/event/controllers/qrCode.controller");
const eventBookingController = require("../verticals/event/controllers/eventBooking.controller");
const eventPaymentController = require("../verticals/event/controllers/eventPayment.controller");

describe("Event Controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dbModels.tenant.findByPk.mockResolvedValue({ id: 1, slug: "test-tenant" });
  });

  describe("event.controller", () => {
    it("getEventsHandler returns list", async () => {
      eventService.getEvents.mockResolvedValue({ rows: [], count: 0 });
      const req = { tenant: { id: 1 }, query: {} };
      const res = createRes();
      await eventController.getEventsHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ rows: [], count: 0 });
    });

    it("getEventHandler returns event", async () => {
      eventService.getEventById.mockResolvedValue({ id: 1, name: "Test" });
      const req = { tenant: { id: 1 }, params: { id: "1" } };
      const res = createRes();
      await eventController.getEventHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, item: { id: 1, name: "Test" } });
    });

    it("getEventHandler returns 404 when not found", async () => {
      eventService.getEventById.mockResolvedValue(null);
      const req = { tenant: { id: 1 }, params: { id: "999" } };
      const res = createRes();
      await eventController.getEventHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("createEventHandler creates event", async () => {
      eventService.createEvent.mockResolvedValue({ id: 1, name: "New Event" });
      const req = { tenant: { id: 1 }, user: { id: 1 }, body: { name: "New Event" } };
      const res = createRes();
      await eventController.createEventHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(eventService.createEvent).toHaveBeenCalledWith({ name: "New Event" }, 1, 1);
    });

    it("updateEventHandler updates event", async () => {
      eventService.updateEvent.mockResolvedValue({ id: 1, name: "Updated" });
      const req = { tenant: { id: 1 }, params: { id: "1" }, body: { name: "Updated" } };
      const res = createRes();
      await eventController.updateEventHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("deleteEventHandler deletes event", async () => {
      eventService.deleteEvent.mockResolvedValue(true);
      const req = { tenant: { id: 1 }, params: { id: "1" } };
      const res = createRes();
      await eventController.deleteEventHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("guestList.controller", () => {
    it("getGuestListHandler returns list", async () => {
      guestListService.getGuestList.mockResolvedValue({ rows: [], count: 0 });
      const req = { tenant: { id: 1 }, params: { eventId: "1" }, query: {} };
      const res = createRes();
      await guestListController.getGuestListHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("addGuestHandler adds guest", async () => {
      guestListService.addGuest.mockResolvedValue({ id: 1, guestName: "Guest" });
      const req = { tenant: { id: 1 }, params: { eventId: "1" }, body: { guestName: "Guest" } };
      const res = createRes();
      await guestListController.addGuestHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("ticketType.controller", () => {
    it("getTicketTypesHandler returns list", async () => {
      ticketTypeService.getTicketTypes.mockResolvedValue([]);
      const req = { tenant: { id: 1 }, params: { eventId: "1" } };
      const res = createRes();
      await ticketTypeController.getTicketTypesHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("createTicketTypeHandler creates ticket type", async () => {
      ticketTypeService.createTicketType.mockResolvedValue({ id: 1, name: "VIP" });
      const req = { tenant: { id: 1 }, params: { eventId: "1" }, body: { name: "VIP" } };
      const res = createRes();
      await ticketTypeController.createTicketTypeHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("qrCode.controller", () => {
    it("getQRCodesHandler returns list", async () => {
      qrCodeService.getQRCodes.mockResolvedValue([]);
      const req = { tenant: { id: 1 }, params: { eventId: "1" } };
      const res = createRes();
      await qrCodeController.getQRCodesHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("generateQRCodeHandler generates code", async () => {
      qrCodeService.generateQRCode.mockResolvedValue({ id: 1, code: "abc123" });
      const req = { tenant: { id: 1 }, params: { eventId: "1" }, body: {} };
      const res = createRes();
      await qrCodeController.generateQRCodeHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("checkinHandler processes checkin", async () => {
      qrCodeService.checkin.mockResolvedValue({
        valid: true,
        admitted: true,
        item: {
          id: 1,
          attendeeName: "Test",
          seat: "A1",
          tier: "VIP",
          checkedInAt: new Date(),
          usedCount: 1,
          maxUses: 1,
        },
      });
      const token = "a".repeat(64);
      const req = { tenant: { id: 1 }, user: { id: 1 }, params: { token } };
      const res = createRes();
      await qrCodeController.checkinHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("checkinHandler returns 404 for invalid code", async () => {
      const mockReturn = {
        valid: false,
        error: "INVALID_TOKEN",
        message: "Invalid QR code format",
      };
      qrCodeService.checkin.mockResolvedValue(mockReturn);
      const token = "b".repeat(64);
      const req = { tenant: { id: 1 }, user: { id: 1 }, params: { token } };
      const res = createRes();
      await qrCodeController.checkinHandler(req, res);
      expect(qrCodeService.checkin).toHaveBeenCalledWith(token, 1, 1, {});
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("eventBooking.controller", () => {
    it("createBookingHandler creates booking", async () => {
      eventBookingService.createBooking.mockResolvedValue({ id: 1, status: "pending" });
      const req = { tenant: { id: 1 }, user: { id: 1 }, body: { eventId: 1, ticketTypeId: 1, quantity: 2 } };
      const res = createRes();
      await eventBookingController.createBookingHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(eventBookingService.createBooking).toHaveBeenCalledWith({ eventId: 1, ticketTypeId: 1, quantity: 2 }, 1, 1);
    });

    it("getBookingsHandler returns list", async () => {
      eventBookingService.getBookings.mockResolvedValue({ rows: [], count: 0 });
      const req = { tenant: { id: 1 }, query: {} };
      const res = createRes();
      await eventBookingController.getBookingsHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ rows: [], count: 0 });
    });

    it("getBookingHandler returns 404 when missing", async () => {
      eventBookingService.getBookingById.mockResolvedValue(null);
      const req = { tenant: { id: 1 }, params: { id: "999" } };
      const res = createRes();
      await eventBookingController.getBookingHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("confirmBookingHandler confirms booking", async () => {
      eventBookingService.updateBookingStatus.mockResolvedValue({ id: 1, status: "confirmed" });
      const req = { tenant: { id: 1 }, params: { id: "1" }, body: { paymentReference: "ref" } };
      const res = createRes();
      await eventBookingController.confirmBookingHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("cancelBookingHandler cancels booking", async () => {
      eventBookingService.cancelBooking.mockResolvedValue({ status: "cancelled" });
      const req = { tenant: { id: 1 }, params: { id: "1" }, body: { reason: "Customer request" } };
      const res = createRes();
      await eventBookingController.cancelBookingHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Booking cancelled", data: { status: "cancelled" } });
    });

    it("transferBookingHandler transfers booking", async () => {
      eventBookingService.transferBooking.mockResolvedValue({ id: 1, guestEmail: "new@example.com" });
      const req = { tenant: { id: 1 }, params: { id: "1" }, body: { newGuestEmail: "new@example.com", newGuestName: "New Guest" } };
      const res = createRes();
      await eventBookingController.transferBookingHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("eventPayment.controller", () => {
    it("initializeBookingPaymentHandler initializes payment", async () => {
      eventBookingService.getBookingById.mockResolvedValue({ id: 1, total: 50, eventId: 1, paymentStatus: "unpaid" });
      eventBookingService.confirmBooking.mockResolvedValue({ id: 1 });
      paystackService.initializeCharge.mockResolvedValue({ authorization_url: "https://paystack.com", reference: "ref123" });
      const req = { tenant: { id: 1 }, params: { bookingId: "1" }, body: { email: "test@example.com" } };
      const res = createRes();
      await eventPaymentController.initializeBookingPaymentHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("initializeBookingPaymentHandler returns 404 when booking missing", async () => {
      eventBookingService.getBookingById.mockResolvedValue(null);
      const req = { tenant: { id: 1 }, params: { bookingId: "999" }, body: { email: "test@example.com" } };
      const res = createRes();
      await eventPaymentController.initializeBookingPaymentHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
