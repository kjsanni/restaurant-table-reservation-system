const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const supportTicketAnalyticsController = require("../controllers/supportTicketAnalytics.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router.use(adminActionLimiter);

router
  .route("/whatsapp/analytics")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_support")), tryCatchHandler(supportTicketAnalyticsController.getWhatsAppAnalyticsHandler))
  .all(httpMethodError);

module.exports = router;
