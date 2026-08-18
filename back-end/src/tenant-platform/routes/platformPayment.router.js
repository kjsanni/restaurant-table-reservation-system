const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const platformPaymentController = require("../controllers/platformPayment.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/summary")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(platformPaymentController.getSummary))
  .all(httpMethodError);

module.exports = router;
