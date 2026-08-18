// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via tryCatchHandler-wrapped adminActionLimiter middleware in all routes
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const verticalTemplateController = require("../controllers/verticalTemplate.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(verticalTemplateController.listTemplatesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(verticalTemplateController.createTemplateHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .patch(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(verticalTemplateController.updateTemplateHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(verticalTemplateController.deleteTemplateHandler))
  .all(httpMethodError);

router
  .route("/:id/clone")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(verticalTemplateController.cloneTemplateHandler))
  .all(httpMethodError);

router
  .route("/usage")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(adminActionLimiter), tryCatchHandler(verticalTemplateController.getTemplateUsageHandler))
  .all(httpMethodError);

module.exports = router;
