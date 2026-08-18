const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const dataRetentionController = require("../controllers/dataRetention.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(dataRetentionController.listRetentionPoliciesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(dataRetentionController.createRetentionPolicyHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .patch(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(dataRetentionController.updateRetentionPolicyHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(dataRetentionController.deleteRetentionPolicyHandler))
  .all(httpMethodError);

router
  .route("/execute")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(dataRetentionController.executeRetentionHandler))
  .all(httpMethodError);

module.exports = router;
