const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const dataRetentionPolicyController = require("../controllers/dataRetentionPolicy.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(adminActionLimiter), tryCatchHandler(dataRetentionPolicyController.listPoliciesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(adminActionLimiter), tryCatchHandler(dataRetentionPolicyController.createPolicyHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(adminActionLimiter), tryCatchHandler(dataRetentionPolicyController.updatePolicyHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_compliance")), tryCatchHandler(adminActionLimiter), tryCatchHandler(dataRetentionPolicyController.deletePolicyHandler))
  .all(httpMethodError);

module.exports = router;
