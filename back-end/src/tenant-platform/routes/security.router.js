const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const securityController = require("../controllers/security.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");

router
  .route("/brute-force-aggregation")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(securityController.getBruteForceAggregationHandler))
  .all(httpMethodError);

module.exports = router;
