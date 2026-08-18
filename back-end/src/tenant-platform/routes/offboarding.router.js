const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const offboardingController = require("../controllers/offboarding.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/:id/offboarding")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(offboardingController.initiateOffboardingHandler))
  .all(httpMethodError);

router
  .route("/:id/offboarding/export")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(offboardingController.exportTenantDataHandler))
  .all(httpMethodError);

router
  .route("/:id/offboarding/anonymize")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(offboardingController.anonymizeTenantDataHandler))
  .all(httpMethodError);

router
  .route("/:id/offboarding/delete")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(offboardingController.deleteTenantDataHandler))
  .all(httpMethodError);

module.exports = router;
