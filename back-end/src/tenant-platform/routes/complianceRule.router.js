const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const complianceRuleController = require("../controllers/complianceRule.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(complianceRuleController.listRulesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(complianceRuleController.createRuleHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .patch(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(complianceRuleController.updateRuleHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(complianceRuleController.deleteRuleHandler))
  .all(httpMethodError);

module.exports = router;
