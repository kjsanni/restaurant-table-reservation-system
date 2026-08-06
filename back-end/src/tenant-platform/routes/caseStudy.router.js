const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const caseStudyController = require("../controllers/caseStudy.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(caseStudyController.listCaseStudiesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(caseStudyController.createCaseStudyHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(caseStudyController.updateCaseStudyHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(caseStudyController.removeCaseStudyHandler))
  .all(httpMethodError);

module.exports = router;
