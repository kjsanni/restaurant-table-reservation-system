
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const dataResidencyController = require("../controllers/data-residency.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/tenants/:tenantId/region")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(dataResidencyController.getTenantRegionHandler))
  .put(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(dataResidencyController.setTenantRegionHandler))
  .all(httpMethodError);

router
  .route("/regions")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(dataResidencyController.getAllRegionsHandler))
  .all(httpMethodError);

router
  .route("/regions/:region/latency")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(dataResidencyController.getRegionLatencyHandler))
  .all(httpMethodError);

module.exports = router;
