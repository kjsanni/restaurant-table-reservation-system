"use strict";

const eventBookingService = require("../services/eventBooking.service");
const { checkUsageLimit } = require("../../../tenant-platform/services/tenantSubscription.service");

const createBookingHandler = async (req, res) => {
  try {
    await checkUsageLimit(req.tenant?.id, "bookings");
    const booking = await eventBookingService.createBooking(
      req.body,
      req.tenant?.id,
      req.user?.id
    );
    res.status(201).json({ success: true, item: booking });
  } catch (err) {
    const status = err.status || 400;
    res.status(status).json({ success: false, message: err.message });
  }
};

const getBookingsHandler = async (req, res) => {
  try {
    const result = await eventBookingService.getBookings(req.tenant?.id, req.query);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getBookingHandler = async (req, res) => {
  try {
    const booking = await eventBookingService.getBookingById(req.params.id, req.tenant?.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    res.status(200).json({ success: true, item: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const confirmBookingHandler = async (req, res) => {
  try {
    const booking = await eventBookingService.confirmBooking(
      req.params.id,
      req.tenant?.id,
      req.body.paymentReference,
      req.body.paymentMethod
    );
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    res.status(200).json({ success: true, item: booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateBookingHandler = async (req, res) => {
  try {
    const booking = await eventBookingService.updateBooking(
      req.params.id,
      req.tenant?.id,
      req.body
    );
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    res.status(200).json({ success: true, item: booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const cancelBookingHandler = async (req, res) => {
  try {
    const result = await eventBookingService.cancelBooking(
      req.params.id,
      req.tenant?.id,
      req.body.reason
    );
    res.status(200).json({ success: true, message: "Booking cancelled", data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const transferBookingHandler = async (req, res) => {
  try {
    const booking = await eventBookingService.transferBooking(
      req.params.id,
      req.tenant?.id,
      req.body.newGuestEmail,
      req.body.newGuestName,
      req.user?.id,
      req.body.reason
    );
    res.status(200).json({ success: true, item: booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  createBookingHandler,
  getBookingsHandler,
  getBookingHandler,
  confirmBookingHandler,
  updateBookingHandler,
  cancelBookingHandler,
  transferBookingHandler,
};
