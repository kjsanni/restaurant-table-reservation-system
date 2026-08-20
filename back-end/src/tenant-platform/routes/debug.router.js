const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const debugController = require("../controllers/debug.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");
const { requireBreakGlass } = require("../../middleware/breakGlass");

router
  .route("/tenant/:tenantId")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(requireBreakGlass), tryCatchHandler(debugController.getTenantDebugInfoHandler))
  .all(httpMethodError);

router
  .route("/platform")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(requireBreakGlass), tryCatchHandler(debugController.getPlatformDebugInfoHandler))
  .all(httpMethodError);

module.exports = router;
