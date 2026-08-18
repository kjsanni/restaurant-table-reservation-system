const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const complianceEvidenceController = require("../controllers/complianceEvidence.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(adminActionLimiter), tryCatchHandler(complianceEvidenceController.listComplianceEvidenceHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(adminActionLimiter), tryCatchHandler(complianceEvidenceController.createComplianceEvidenceHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(adminActionLimiter), tryCatchHandler(complianceEvidenceController.getComplianceEvidenceHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(adminActionLimiter), tryCatchHandler(complianceEvidenceController.updateComplianceEvidenceHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(adminActionLimiter), tryCatchHandler(complianceEvidenceController.deleteComplianceEvidenceHandler))
  .all(httpMethodError);

module.exports = router;
