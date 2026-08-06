const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const insuranceDocumentController = require("../controllers/insuranceDocument.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(insuranceDocumentController.listInsuranceDocumentsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(insuranceDocumentController.createInsuranceDocumentHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(insuranceDocumentController.getInsuranceDocumentHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(insuranceDocumentController.updateInsuranceDocumentHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(insuranceDocumentController.deleteInsuranceDocumentHandler))
  .all(httpMethodError);

module.exports = router;
