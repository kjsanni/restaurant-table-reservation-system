const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const benchmarkController = require("../controllers/benchmark.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/")
  .get(
    tryCatchHandler(protect), tryCatchHandler(adminActionLimiter),
    tryCatchHandler(requirePermission("manage_tenants")),
    tryCatchHandler(benchmarkController.getBenchmarksHandler)
  )
  .all(httpMethodError);

module.exports = router;
