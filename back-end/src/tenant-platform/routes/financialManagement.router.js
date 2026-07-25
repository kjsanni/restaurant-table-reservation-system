const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const financialController = require("../controllers/financialManagement.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/refunds")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(financialController.listRefundsHandler))
  .all(httpMethodError);

router
  .route("/refunds/:id/status")
  .patch(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(financialController.updateRefundStatusHandler))
  .all(httpMethodError);

router
  .route("/subscription-health")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(financialController.getSubscriptionHealthHandler))
  .all(httpMethodError);

router
  .route("/anomalies")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(financialController.detectFinancialAnomaliesHandler))
  .all(httpMethodError);

module.exports = router;
