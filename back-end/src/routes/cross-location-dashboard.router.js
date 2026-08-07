"use strict";
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const crossLocationDashboardController = require("../controllers/cross-location-dashboard.controller");
const { protect, requirePermission } = require("../middleware/auth");
const { requireVertical } = require("../middleware/requireVertical");
const { generalLimiter } = require("../middleware/rateLimit");

router
  .route("/")
  .get(
    tryCatchHandler(generalLimiter),
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_reports")),
    tryCatchHandler(crossLocationDashboardController.getCrossLocationDashboardHandler)
  )
  .all(httpMethodError);

module.exports = router;
