const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const caseStudyController = require("../controllers/caseStudy.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");

const caseStudyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

router
  .route("/")
  .get(tryCatchHandler(caseStudyRateLimiter), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(caseStudyController.listCaseStudiesHandler))
  .post(tryCatchHandler(caseStudyRateLimiter), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(caseStudyController.createCaseStudyHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .patch(tryCatchHandler(caseStudyRateLimiter), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(caseStudyController.updateCaseStudyHandler))
  .delete(tryCatchHandler(caseStudyRateLimiter), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(caseStudyController.removeCaseStudyHandler))
  .all(httpMethodError);

module.exports = router;
