"use strict";
const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const tryCatchHandler = require("../middleware/tryCatch");
const salonCustomerPortalController = require("../controllers/salon-customer-portal.controller");
const { protect, requirePermission } = require("../middleware/auth");
const { requireVertical } = require("../middleware/requireVertical");

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
    tryCatchHandler(requirePermission("edit_appointments")),
    tryCatchHandler(salonCustomerPortalController.cancelSalonAppointmentHandler)
  )
  .all(httpMethodError);

router
  .route("/appointments/:appointmentId/rebook")
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("edit_appointments")),
    tryCatchHandler(salonCustomerPortalController.rebookSalonAppointmentHandler)
  )
  .all(httpMethodError);

router
  .route("/gift-cards")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(salonCustomerPortalController.getCustomerGiftCardsHandler)
  )
  .all(httpMethodError);

router
  .route("/referrals")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(salonCustomerPortalController.getCustomerReferralsHandler)
  )
  .all(httpMethodError);

router
  .route("/packages")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(salonCustomerPortalController.listServicePackagesHandler)
  )
  .all(httpMethodError);

router
  .route("/pricing-rules")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(salonCustomerPortalController.listPricingRulesHandler)
  )
  .all(httpMethodError);

module.exports = router;
