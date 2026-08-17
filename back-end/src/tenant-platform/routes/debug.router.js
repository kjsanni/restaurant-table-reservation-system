const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const debugController = require("../controllers/debug.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/tenant/:tenantId")
  .get(tryCatchHandler(adminActionLimiter), tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(debugController.getTenantDebugInfoHandler))
  .all(httpMethodError);

router
  .route("/platform")
  .get(tryCatchHandler(adminActionLimiter), tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(debugController.getPlatformDebugInfoHandler))
  .all(httpMethodError);

module.exports = router;
