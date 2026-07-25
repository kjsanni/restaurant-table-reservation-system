const express = require("express");
const router = express.Router();
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
  .route("/webhooks/status")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(integrationController.getWebhookStatusHandler))
  .all(httpMethodError);

router
  .route("/third-party")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(integrationController.getThirdPartyStatusHandler))
  .all(httpMethodError);

module.exports = router;
