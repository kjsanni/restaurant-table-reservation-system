const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const subProcessorController = require("../controllers/subProcessor.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(subProcessorController.listSubProcessorsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(subProcessorController.createSubProcessorHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(subProcessorController.updateSubProcessorHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(subProcessorController.deleteSubProcessorHandler))
  .all(httpMethodError);

module.exports = router;
