"use strict";
const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const tryCatchHandler = require("../middleware/tryCatch");
const salonReportsController = require("../controllers/salon-reports.controller");
const { protect, requirePermission } = require("../middleware/auth");
const { requireVertical } = require("../middleware/requireVertical");

router
  .route("/reports")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(salonReportsController.getSalonReportsHandler)
  )
  .all(httpMethodError);

module.exports = router;
