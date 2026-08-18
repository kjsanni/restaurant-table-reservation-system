// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via tryCatchHandler-wrapped adminActionLimiter middleware in all routes
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const apiLatencyController = require("../controllers/apiLatency.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(apiLatencyController.getApiLatencyHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_technical")), tryCatchHandler(adminActionLimiter), tryCatchHandler(apiLatencyController.clearApiLatencyHandler))
  .all(httpMethodError);

module.exports = router;
