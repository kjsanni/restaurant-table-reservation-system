const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const securityController = require("../controllers/security.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");

router
  .route("/brute-force-aggregation")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(securityController.getBruteForceAggregationHandler))
  .all(httpMethodError);

module.exports = router;
