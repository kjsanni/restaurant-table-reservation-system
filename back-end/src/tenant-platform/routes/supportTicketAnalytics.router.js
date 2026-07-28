const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const supportTicketAnalyticsController = require("../controllers/supportTicketAnalytics.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/whatsapp/analytics")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportTicketAnalyticsController.getWhatsAppAnalyticsHandler))
  .all(httpMethodError);

module.exports = router;
