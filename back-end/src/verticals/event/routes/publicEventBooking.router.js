"use strict";

const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const { generalLimiter } = require("../../../middleware/rateLimit");
const publicEventBookingController = require("../controllers/publicEventBooking.controller");

router.use(generalLimiter);

router
  .route("/")
  .post(tryCatchHandler(publicEventBookingController.createPublicBookingHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/:bookingId/payments/initialize")
  .post(tryCatchHandler(publicEventBookingController.initializePublicBookingPaymentHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/:id")
  .get(tryCatchHandler(publicEventBookingController.getPublicBookingHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;
