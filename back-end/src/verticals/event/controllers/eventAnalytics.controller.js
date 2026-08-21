"use strict";

const eventBookingService = require("../services/eventBooking.service");
const eventService = require("../services/event.service");

const getEventAnalyticsHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { eventId, from, to } = req.query;

    if (!eventId) {
      return res.status(400).json({ success: false, message: "eventId is required" });
    }

    const event = await eventService.getEventById(eventId, tenantId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const filters = { eventId };
    if (from) filters.from = from;
    if (to) filters.to = to;

    const bookings = await eventBookingService.getBookings(tenantId, filters);
    const rows = bookings.rows || [];

    const totalBookings = rows.length;
    const totalConfirmed = rows.filter((b) => b.status === "confirmed").length;
    const totalPending = rows.filter((b) => b.status === "pending").length;
    const totalCancelled = rows.filter((b) => b.status === "cancelled").length;
    const totalRevenue = rows
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + Number(b.total || 0), 0);
    const totalTicketsSold = rows.reduce((sum, b) => sum + Number(b.quantity || 0), 0);

    const byTicketType = {};
    rows.forEach((b) => {
      const key = b.ticketType?.name || "Unknown";
      if (!byTicketType[key]) {
        byTicketType[key] = { count: 0, revenue: 0 };
      }
      byTicketType[key].count += Number(b.quantity || 0);
      if (b.paymentStatus === "paid") {
        byTicketType[key].revenue += Number(b.total || 0);
      }
    });

    const byStatus = {};
    rows.forEach((b) => {
      byStatus[b.status || "unknown"] = (byStatus[b.status || "unknown"] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        eventId,
        eventName: event.name,
        totalBookings,
        totalConfirmed,
        totalPending,
        totalCancelled,
        totalRevenue,
        totalTicketsSold,
        byTicketType,
        byStatus,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getEventAnalyticsTrendHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { eventId, from, to } = req.query;

    if (!eventId) {
      return res.status(400).json({ success: false, message: "eventId is required" });
    }

    const filters = { eventId };
    if (from) filters.from = from;
    if (to) filters.to = to;

    const bookings = await eventBookingService.getBookings(tenantId, filters);
    const rows = bookings.rows || [];

    const trend = rows.reduce((acc, b) => {
      const day = b.bookedAt ? new Date(b.bookedAt).toISOString().slice(0, 10) : "unknown";
      if (!acc[day]) {
        acc[day] = { bookings: 0, revenue: 0 };
      }
      acc[day].bookings += 1;
      if (b.paymentStatus === "paid") {
        acc[day].revenue += Number(b.total || 0);
      }
      return acc;
    }, {});

    const trendArray = Object.keys(trend)
      .sort()
      .map((day) => ({ date: day, ...trend[day] }));

    res.status(200).json({ success: true, data: trendArray });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getEventAnalyticsHandler,
  getEventAnalyticsTrendHandler,
};
