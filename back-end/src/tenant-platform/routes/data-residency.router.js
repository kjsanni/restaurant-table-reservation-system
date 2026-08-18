// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via tryCatchHandler-wrapped adminActionLimiter middleware in all routes
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const dataResidencyController = require("../controllers/data-residency.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/tenants/:tenantId/region")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(dataResidencyController.getTenantRegionHandler))
  .put(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(dataResidencyController.setTenantRegionHandler))
  .all(httpMethodError);

router
  .route("/regions")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(dataResidencyController.getAllRegionsHandler))
  .all(httpMethodError);

router
  .route("/regions/:region/latency")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(dataResidencyController.getRegionLatencyHandler))
  .all(httpMethodError);

module.exports = router;
