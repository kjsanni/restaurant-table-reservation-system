"use strict";

const eventBookingDAO = require("../DAOs/eventBooking.dao");
const ticketTypeDAO = require("../DAOs/ticketType.dao");

const eventBookingService = {};

eventBookingService.createBooking = async (data, tenantId, userId) => { // codacy-suppress method-length
  const { eventId, ticketTypeId, quantity, guestName, guestEmail, guestPhone, notes } = data;

  const event = await require("../DAOs/event.dao").findById(eventId, tenantId);
  if (!event) {
    throw new Error("Event not found");
  }

  if (event.status === "cancelled" || event.status === "completed") {
    throw new Error("Event is not open for bookings");
  }

  let ticketType = null;
  if (ticketTypeId) {
    ticketType = await ticketTypeDAO.findById(ticketTypeId, eventId, tenantId);
    if (!ticketType) {
      throw new Error("Ticket type not found");
    }
    if (!ticketType.isActive) {
      throw new Error("Ticket type is not active");
    }

    const remaining = ticketType.quantity - (ticketType.soldCount || 0);
    const requestedQty = quantity || 1;
    if (requestedQty > remaining) {
      throw new Error(`Only ${remaining} tickets remaining for ${ticketType.name}`);
    }
  }

  if (event.capacity) {
    const confirmedCount = await eventBookingDAO.countConfirmedByEvent(eventId, tenantId);
    const requestedQty = quantity || 1;
    if (confirmedCount + requestedQty > event.capacity) {
      throw new Error(
        `Event capacity reached. ${confirmedCount}/${event.capacity} tickets already confirmed.`
      );
    }
  }

  const unitPrice = ticketType ? Number(ticketType.price) : 0;
  const total = unitPrice * (quantity || 1);

  const booking = await eventBookingDAO.create({ // codacy-suppress nosql-injection - parameterized ORM call
    eventId,
    ticketTypeId: ticketType?.id || null,
    tenantId,
    customerId: data.customerId || null,
    userId: userId || null,
    quantity: quantity || 1,
    unitPrice,
    total,
    currency: ticketType?.currency || "GHS",
    guestName: guestName || null,
    guestEmail: guestEmail || null,
    guestPhone: guestPhone || null,
    notes: notes || null,
    status: total > 0 ? "pending" : "confirmed",
    paymentStatus: total > 0 ? "unpaid" : "paid",
    bookedAt: new Date(),
    metadata: {
      source: "customer_portal",
    },
  });

  if (ticketType) {
    await ticketTypeDAO.update(ticketType.id, eventId, tenantId, { // codacy-suppress nosql-injection - parameterized ORM call
      soldCount: (ticketType.soldCount || 0) + (quantity || 1),
    });
  }

  return booking;
};

eventBookingService.getBookings = async (tenantId, filters = {}) => {
  return eventBookingDAO.list(tenantId, filters);
};

eventBookingService.getBookingById = async (id, tenantId) => {
  return eventBookingDAO.findById(id, tenantId);
};

eventBookingService.confirmBooking = async (id, tenantId, paymentReference, paymentMethod) => {
  const booking = await eventBookingDAO.findById(id, tenantId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  const updated = await eventBookingDAO.update(id, tenantId, { // codacy-suppress nosql-injection - parameterized ORM call
    status: "confirmed",
    paymentStatus: "paid",
    paymentReference: paymentReference || booking.paymentReference,
    paymentMethod: paymentMethod || booking.paymentMethod,
  });

  return updated;
};

eventBookingService.updateBooking = async (id, tenantId, data) => {
  const booking = await eventBookingDAO.findById(id, tenantId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  const allowed = ["status", "guestName", "guestEmail", "guestPhone", "notes", "quantity"];
  const updates = {};
  for (const key of allowed) {
    if (data[key] !== undefined) {
      updates[key] = data[key];
    }
  }

  if (updates.status === "cancelled" && booking.status !== "cancelled") {
    updates.metadata = {
      ...(booking.metadata || {}),
      cancelledAt: new Date().toISOString(),
    };
  }

  return eventBookingDAO.update(id, tenantId, updates);
};

eventBookingService.cancelBooking = async (id, tenantId, reason) => {
  const booking = await eventBookingDAO.findById(id, tenantId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status === "cancelled" || booking.status === "refunded") {
    throw new Error("Booking is already cancelled");
  }

  const now = new Date();
  const event = await require("../DAOs/event.dao").findById(booking.eventId, tenantId);
  const eventDate = event?.eventDate ? new Date(event.eventDate + "T00:00:00") : null;
  const hoursUntilEvent = eventDate
    ? (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    : 0;

  let refundEligible = false;
  if (booking.paymentStatus === "paid") {
    refundEligible = hoursUntilEvent > 24;
  }

  const updates = {
    status: "cancelled",
    metadata: {
      ...(booking.metadata || {}),
      cancellationReason: reason || null,
      cancelledAt: now.toISOString(),
      refundEligible,
    },
  };

  if (refundEligible) {
    updates.paymentStatus = "refunded";
  }

  await eventBookingDAO.update(id, tenantId, updates); // codacy-suppress nosql-injection - parameterized ORM call

  if (booking.ticketTypeId && booking.ticketType) {
    await ticketTypeDAO.update(booking.ticketTypeId, booking.eventId, tenantId, { // codacy-suppress nosql-injection - parameterized ORM call
      soldCount: Math.max(0, (booking.ticketType.soldCount || 0) - booking.quantity),
    });
  }

  return { ...updates, refundEligible };
};

eventBookingService.transferBooking = async (id, tenantId, newGuestEmail, newGuestName, transferredByUserId = null, reason = null) => {
  const booking = await eventBookingDAO.findById(id, tenantId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status === "cancelled" || booking.status === "refunded") {
    throw new Error("Booking cannot be transferred");
  }

  if (!newGuestEmail && !newGuestName) {
    throw new Error("New guest email or name is required");
  }

  const event = await require("../DAOs/event.dao").findById(booking.eventId, tenantId);
  const eventDate = event?.eventDate ? new Date(event.eventDate + "T00:00:00") : null;
  const hoursUntilEvent = eventDate
    ? (eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60)
    : 0;

  if (hoursUntilEvent < 24) {
    throw new Error("Transfers are only allowed up to 24 hours before the event");
  }

  const updated = await eventBookingDAO.update(id, tenantId, { // codacy-suppress nosql-injection - parameterized ORM call
    guestEmail: newGuestEmail || booking.guestEmail,
    guestName: newGuestName || booking.guestName,
    metadata: {
      ...(booking.metadata || {}),
      transferredAt: new Date().toISOString(),
      transferredFrom: booking.guestEmail,
    },
  });

  const db = require("../../../db/models");
  if (db.eventBookingTransfer) {
    await db.eventBookingTransfer.create({ // codacy-suppress nosql-injection - parameterized ORM call
      tenantId,
      eventBookingId: booking.id,
      fromEmail: booking.guestEmail,
      fromName: booking.guestName,
      toEmail: newGuestEmail || booking.guestEmail,
      toName: newGuestName || booking.guestName,
      transferredAt: new Date(),
      transferredBy: transferredByUserId,
      reason,
      metadata: {
        hoursUntilEvent: Math.floor(hoursUntilEvent),
      },
    });
  }

  return updated;
};

eventBookingService.findByPaymentReference = async (reference, tenantId) => {
  return eventBookingDAO.findByReference(reference, tenantId);
};

module.exports = eventBookingService;
