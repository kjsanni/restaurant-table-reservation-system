const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const failedPaymentAlertController = require("../controllers/failedPaymentAlert.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(failedPaymentAlertController.listFailedPaymentAlertsHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(failedPaymentAlertController.getFailedPaymentAlertHandler))
  .all(httpMethodError);

router
  .route("/:id/retry")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(failedPaymentAlertController.retryFailedPaymentHandler))
  .all(httpMethodError);

router
  .route("/:id/resolve")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(failedPaymentAlertController.resolveFailedPaymentHandler))
  .all(httpMethodError);

module.exports = router;
