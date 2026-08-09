"use strict";
const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const crossLocationDashboardController = require("../controllers/cross-location-dashboard.controller");
const { protect, requirePermission } = require("../middleware/auth");
const { requireVertical } = require("../middleware/requireVertical");
const { generalLimiter } = require("../middleware/rateLimit");

const crossLocationDashboardRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

router
  .route("/")
  .get(
    crossLocationDashboardRateLimiter,
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_reports")),
    tryCatchHandler(crossLocationDashboardController.getCrossLocationDashboardHandler)
  )
  .all(httpMethodError);

module.exports = router;
