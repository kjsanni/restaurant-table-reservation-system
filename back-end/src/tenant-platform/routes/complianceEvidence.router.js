
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const complianceEvidenceController = require("../controllers/complianceEvidence.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(complianceEvidenceController.listComplianceEvidenceHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(complianceEvidenceController.createComplianceEvidenceHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(complianceEvidenceController.getComplianceEvidenceHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(complianceEvidenceController.updateComplianceEvidenceHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(complianceEvidenceController.deleteComplianceEvidenceHandler))
  .all(httpMethodError);

module.exports = router;
