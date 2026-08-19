const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const integrationController = require("../controllers/integrationAnalytics.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/paystack/transactions")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(integrationController.getPaystackTransactionsHandler))
  .all(httpMethodError);

router
  .route("/paystack/settlements")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(integrationController.getPaystackSettlementsHandler))
  .all(httpMethodError);

router
  .route("/paystack/disputes")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(integrationController.getPaystackDisputesHandler))
  .all(httpMethodError);

router
  .route("/paystack/fees")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(integrationController.getPaystackFeeAnalysisHandler))
  .all(httpMethodError);

router
  .route("/webhooks/retries")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(integrationController.getWebhookRetryHandler))
  .all(httpMethodError);

router
  .route("/whatsapp/analytics")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(integrationController.getWhatsAppAnalyticsHandler))
  .all(httpMethodError);

router
  .route("/whatsapp/campaigns")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(integrationController.getWhatsAppCampaignAnalyticsHandler))
  .all(httpMethodError);

router
  .route("/shaqexpress/analytics")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(integrationController.getShaqExpressAnalyticsHandler))
  .all(httpMethodError);

router
  .route("/events/unified")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(integrationController.getUnifiedIntegrationEventLogHandler))
  .all(httpMethodError);

router
  .route("/whatsapp/delivery-failures")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(integrationController.getWhatsAppDeliveryFailuresHandler))
  .all(httpMethodError);

router
  .route("/webhooks/status")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(integrationController.getWebhookStatusHandler))
  .all(httpMethodError);

router
  .route("/third-party")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(integrationController.getThirdPartyStatusHandler))
  .all(httpMethodError);

module.exports = router;
