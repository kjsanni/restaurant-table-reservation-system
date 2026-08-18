const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const supportTicketAnalyticsController = require("../controllers/supportTicketAnalytics.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");

router
  .route("/whatsapp/analytics")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_support")), tryCatchHandler(supportTicketAnalyticsController.getWhatsAppAnalyticsHandler))
  .all(httpMethodError);

module.exports = router;
