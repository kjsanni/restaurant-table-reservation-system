"use strict";

const { buildSplitConfig, initializeCharge } = require("../../../tenant-platform/services/paystack.service");

const initializeBookingPaymentHandler = async (req, res) => {
  const { bookingId } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  const db = require("../../../db/models");
  const eventBookingService = require("../services/eventBooking.service");
  const booking = await eventBookingService.getBookingById(bookingId, req.tenant?.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  if (booking.paymentStatus === "paid") {
    return res.status(400).json({ success: false, message: "Booking is already paid" });
  }

  const tenant = await db.tenant.findByPk(req.tenant?.id);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }

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

module.exports = {
  initializeBookingPaymentHandler,
};
