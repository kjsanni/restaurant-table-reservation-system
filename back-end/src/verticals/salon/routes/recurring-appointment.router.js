"use strict";
const express = require("express");
const router = express.Router();
const httpMethodError = require("../../../middleware/httpMethodError");
const tryCatchHandler = require("../../../middleware/tryCatch");
const recurringAppointmentController = require("../controllers/recurring-appointment.controller");
const { protect, requirePermission } = require("../../../middleware/auth");
const { requireVertical } = require("../../../middleware/requireVertical");

router
  .route("/")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(recurringAppointmentController.getRecurringAppointmentsHandler)
  )
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("edit_appointments")),
    tryCatchHandler(recurringAppointmentController.createRecurringAppointmentHandler)
  )
  .all(httpMethodError);

router
  .route("/:id")
  .patch(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("edit_appointments")),
    tryCatchHandler(recurringAppointmentController.updateRecurringAppointmentHandler)
  )
  .all(httpMethodError);

module.exports = router;
