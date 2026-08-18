"use strict";
const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via generalLimiter middleware
const { generalLimiter } = require("../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const salonDashboardController = require("../controllers/salon-dashboard.controller");
const { protect, requirePermission } = require("../middleware/auth");
const { requireVertical } = require("../middleware/requireVertical");

router
  .route("/")
  .get(
    tryCatchHandler(protect), tryCatchHandler(generalLimiter),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(salonDashboardController.getSalonDashboardHandler)
  )
  .all(httpMethodError);

module.exports = router;
