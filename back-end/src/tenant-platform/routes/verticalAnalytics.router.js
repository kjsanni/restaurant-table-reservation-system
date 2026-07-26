const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const verticalAnalyticsController = require("../controllers/verticalAnalytics.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(verticalAnalyticsController.getVerticalAnalyticsHandler))
  .all(httpMethodError);

module.exports = router;
