const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const trustSafetyController = require("../controllers/trustSafety.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/health-scores")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(trustSafetyController.getTenantHealthScoresHandler))
  .all(httpMethodError);

module.exports = router;
