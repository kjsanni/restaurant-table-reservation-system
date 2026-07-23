"use strict";
const express = require("express");
const router = express.Router();
const httpMethodError = require("../../middleware/httpMethodError");
const tryCatchHandler = require("../../middleware/tryCatch");
const salonCustomerPortalController = require("../controllers/salon-customer-portal.controller");
const { protect, requirePermission } = require("../../middleware/auth");
const { requireVertical } = require("../../middleware/requireVertical");

router
  .route("/profile")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(salonCustomerPortalController.getSalonCustomerProfileHandler)
  )
  .all(httpMethodError);

router
  .route("/appointments")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(salonCustomerPortalController.getSalonCustomerAppointmentsHandler)
  )
  .all(httpMethodError);

router
  .route("/appointments/:appointmentId/cancel")
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_appointments")),
    tryCatchHandler(salonCustomerPortalController.cancelSalonAppointmentHandler)
  )
  .all(httpMethodError);

module.exports = router;
