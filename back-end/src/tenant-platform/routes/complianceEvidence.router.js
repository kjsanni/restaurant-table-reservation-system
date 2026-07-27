const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const complianceEvidenceController = require("../controllers/complianceEvidence.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(complianceEvidenceController.listComplianceEvidenceHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(complianceEvidenceController.createComplianceEvidenceHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(complianceEvidenceController.getComplianceEvidenceHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(complianceEvidenceController.updateComplianceEvidenceHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(complianceEvidenceController.deleteComplianceEvidenceHandler))
  .all(httpMethodError);

module.exports = router;
