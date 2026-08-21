"use strict";

const eventBookingService = require("../services/eventBooking.service");
const { Event } = require("../../../db/models");
const { checkUsageLimit } = require("../../../tenant-platform/services/tenantSubscription.service");

const createPublicBookingHandler = async (req, res) => {
  try {
    const { eventId, ticketTypeId, quantity, guestName, guestEmail, guestPhone, notes } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, message: "Event ID is required" });
    }

    const event = await Event.findOne({
      where: { id: eventId, status: "published" },
      include: [{ association: "tenant", attributes: ["id", "status"] }],
    });

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const tenant = event.tenant;
    if (!tenant || tenant.status !== "active") {
      return res.status(400).json({ success: false, message: "Event is not available for booking" });
    }

    try {
      await checkUsageLimit(tenant.id, "bookings");
    } catch (err) {
      const status = err.status || 400;
      return res.status(status).json({ success: false, message: err.message });
    }

    const booking = await eventBookingService.createBooking(
      {
        eventId,
        ticketTypeId,
        quantity,
        guestName,
        guestEmail,
        guestPhone,
        notes,
      },
      tenant.id,
      null
    );

    res.status(201).json({ success: true, item: booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const initializePublicBookingPaymentHandler = async (req, res) => {
  const { bookingId } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  const db = require("../../../db/models");
  const eventBookingService = require("../services/eventBooking.service");

  const booking = await eventBookingService.getBookingById(bookingId, null);
  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  if (booking.paymentStatus === "paid") {
    return res.status(400).json({ success: false, message: "Booking is already paid" });
  }

  const tenant = await db.tenant.findByPk(booking.tenantId);
  if (!tenant || tenant.status !== "active") {
    return res.status(400).json({ success: false, message: "Tenant is not active" });
  }

  const { buildSplitConfig, initializeCharge } = require("../../../tenant-platform/services/paystack.service");
  const splitConfig = buildSplitConfig(tenant);
  const amount = Number(booking.total);

  try {
    const result = await initializeCharge({
      email,
      amount,
      metadata: {
        tenantId: tenant.id,
        eventId: booking.eventId,
        bookingId: booking.id,
        ticketTypeId: booking.ticketTypeId,
        tenantSlug: tenant.slug,
        source: "public_checkout",
      },
      splitConfig,
    });

    return res.status(200).json({
      success: true,
      authorizationUrl: result.authorization_url,
      accessCode: result.access_code,
      reference: result.reference,
    });
  } catch {
    return res.status(500).json({ success: false, message: "Payment initialization failed" });
  }
};

const getPublicBookingHandler = async (req, res) => {
  try {
    const booking = await require("../services/eventBooking.service").getBookingById(req.params.id, null);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    res.status(200).json({ success: true, item: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createPublicBookingHandler,
  initializePublicBookingPaymentHandler,
  getPublicBookingHandler,
};
